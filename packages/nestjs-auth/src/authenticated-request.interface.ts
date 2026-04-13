import type { JwtPayload } from "@driving-school-booking/shared-types";
import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
