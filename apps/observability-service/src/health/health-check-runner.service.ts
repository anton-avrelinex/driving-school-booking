import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectModel, InjectConnection } from "@nestjs/mongoose";
import { Model, Connection } from "mongoose";
import { ConfigService } from "@nestjs/config";
import * as net from "net";
import {
  HEALTH_COMPONENTS,
  HEALTH_STATUSES,
  type HealthComponent,
  type HealthStatus,
} from "@driving-school-booking/shared-types";
import { HealthCheck } from "../schemas/health-check.schema";

interface ProbeResult {
  component: HealthComponent;
  timestamp: Date;
  status: HealthStatus;
  responseTimeMs: number;
  error: string | null;
}

@Injectable()
export class HealthCheckRunnerService {
  private readonly logger = new Logger(HealthCheckRunnerService.name);
  private readonly lastStatus = new Map<HealthComponent, HealthStatus>();

  private readonly mainServiceUrl: string;
  private readonly nginxUrl: string;
  private readonly postgresHost: string;
  private readonly postgresPort: number;
  private readonly redisUrl: string;

  constructor(
    @InjectModel(HealthCheck.name)
    private readonly healthCheckModel: Model<HealthCheck>,
    @InjectConnection()
    private readonly mongoConnection: Connection,
    private readonly configService: ConfigService,
  ) {
    this.mainServiceUrl =
      this.configService.get<string>("HEALTH_MAIN_SERVICE_URL") ??
      "http://main-service:3001/api/health";
    this.nginxUrl =
      this.configService.get<string>("HEALTH_NGINX_URL") ?? "http://nginx:80/";
    this.postgresHost =
      this.configService.get<string>("HEALTH_POSTGRES_HOST") ?? "postgres";
    this.postgresPort = Number.parseInt(
      this.configService.get<string>("HEALTH_POSTGRES_PORT") ?? "5432",
      10,
    );
    this.redisUrl =
      this.configService.get<string>("HEALTH_REDIS_URL") ??
      this.configService.get<string>("REDIS_URL") ??
      "redis://:redis@redis:6379";
  }

  @Cron("*/1 * * * *")
  async runChecks(): Promise<void> {
    const results = await Promise.allSettled([
      this.probeWithTimeout(HEALTH_COMPONENTS.MAIN_SERVICE, () =>
        this.probeHttp(this.mainServiceUrl),
      ),
      this.probeWithTimeout(HEALTH_COMPONENTS.OBS_SERVICE, () =>
        this.probeObsSelf(),
      ),
      this.probeWithTimeout(HEALTH_COMPONENTS.POSTGRES, () =>
        this.probeTcp(this.postgresHost, this.postgresPort),
      ),
      this.probeWithTimeout(HEALTH_COMPONENTS.MONGODB, () => this.probeMongo()),
      this.probeWithTimeout(HEALTH_COMPONENTS.REDIS, () => this.probeRedis()),
      this.probeWithTimeout(HEALTH_COMPONENTS.NGINX, () =>
        this.probeHttp(this.nginxUrl, true),
      ),
    ]);

    const probeResults: ProbeResult[] = results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : {
            component: "unknown" as HealthComponent,
            timestamp: new Date(),
            status: HEALTH_STATUSES.UNHEALTHY,
            responseTimeMs: 0,
            error: String(r.reason),
          },
    );

    this.logTransitions(probeResults);

    await this.healthCheckModel.insertMany(probeResults);
  }

  private async probeWithTimeout(
    component: HealthComponent,
    probe: () => Promise<void>,
  ): Promise<ProbeResult> {
    const start = Date.now();
    try {
      await Promise.race([
        probe(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout (5s)")), 5000),
        ),
      ]);

      return {
        component,
        timestamp: new Date(),
        status: HEALTH_STATUSES.HEALTHY,
        responseTimeMs: Date.now() - start,
        error: null,
      };
    } catch (err) {
      return {
        component,
        timestamp: new Date(),
        status: HEALTH_STATUSES.UNHEALTHY,
        responseTimeMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async probeHttp(url: string, cacheBust = false): Promise<void> {
    const targetUrl = cacheBust
      ? `${url}${url.includes("?") ? "&" : "?"}_cb=${Date.now()}`
      : url;

    const response = await fetch(targetUrl, {
      headers: cacheBust ? { "Cache-Control": "no-cache, no-store" } : {},
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  private async probeObsSelf(): Promise<void> {
    const db = this.mongoConnection.db;
    if (!db) throw new Error("MongoDB not initialized");
    await db.admin().ping({ timeoutMS: 2000 });
    await this.probeRedis();
  }

  private probeTcp(host: string, port: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);
      socket.on("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("TCP timeout"));
      });
      socket.on("error", (err) => {
        socket.destroy();
        reject(err);
      });
      socket.connect(port, host);
    });
  }

  private async probeMongo(): Promise<void> {
    const db = this.mongoConnection.db;
    if (!db) throw new Error("MongoDB not initialized");
    await db.admin().ping({ timeoutMS: 2000 });
  }

  private async probeRedis(): Promise<void> {
    const { createClient } = await import("redis");
    const client = createClient({ url: this.redisUrl });
    try {
      await client.connect();
      await client.ping();
    } finally {
      await client.quit().catch(() => {});
    }
  }

  private logTransitions(results: ProbeResult[]): void {
    for (const result of results) {
      const prev = this.lastStatus.get(result.component);
      if (prev && prev !== result.status) {
        if (result.status === HEALTH_STATUSES.UNHEALTHY) {
          this.logger.warn(`${result.component} went DOWN: ${result.error}`);
        } else {
          this.logger.log(`${result.component} is back UP`);
        }
      }
      this.lastStatus.set(result.component, result.status);
    }
  }
}
