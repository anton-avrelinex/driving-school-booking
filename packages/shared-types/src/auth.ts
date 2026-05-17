import type { Role } from "./constants";

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface AuthSessionDto {
  id: string;
  schoolId: string;
  role: Role;
  mustChangePassword: boolean;
}

export interface JwtPayload {
  sub: string;
  schoolId: string;
  role: Role;
  mustChangePassword: boolean;
  exp: number;
}
