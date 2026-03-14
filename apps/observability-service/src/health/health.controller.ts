import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

@Controller("health")
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  async check() {
    try {
      const db = this.connection.db;
      if (!db) {
        throw new Error("Database not initialized");
      }

      await db.admin().ping({ timeoutMS: 500 });
      return { status: "ok", db: "connected" };
    } catch {
      throw new ServiceUnavailableException({
        status: "degraded",
        db: "disconnected",
      });
    }
  }
}
