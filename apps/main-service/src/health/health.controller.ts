import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    const health: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.db = "connected";
    } catch {
      health.db = "disconnected";
    }

    try {
      await Promise.race([
        this.redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 500),
        ),
      ]);
      health.redis = "connected";
    } catch {
      health.redis = "disconnected";
    }

    const status = Object.values(health).every((v) => v === "connected")
      ? "ok"
      : "degraded";

    if (status === "degraded") {
      throw new ServiceUnavailableException({ status, ...health });
    }

    return { status, ...health };
  }
}
