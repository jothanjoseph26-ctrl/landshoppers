import type { MiddlewareHandler } from "hono";

import { UserRole } from "@landshoppers/db";

import { ApiError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/jwt.js";
import type { ApiEnv } from "../types/env.js";

function extractBearer(header: string | undefined): string | undefined {
  if (!header?.startsWith("Bearer ")) return undefined;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : undefined;
}

/** attaches `bearerToken` on context; verification is a later milestone */
export const optionalBearer: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const bearerToken = extractBearer(c.req.header("Authorization"));
  c.set("bearerToken", bearerToken);
  await next();
};

/** Requires Authorization header with opaque bearer string only (legacy stub routes). */
export const requireBearer: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const bearerToken = extractBearer(c.req.header("Authorization"));
  if (!bearerToken) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid Authorization bearer token");
  }
  c.set("bearerToken", bearerToken);
  await next();
};

/** Verifies HS256 access JWT and attaches `authUser`. */
export const requireAuth: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const bearerToken = extractBearer(c.req.header("Authorization"));
  if (!bearerToken) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing access token");
  }
  const claims = await verifyAccessToken(bearerToken);
  const role = claims.role as UserRole;
  if (!Object.values(UserRole).includes(role)) {
    throw new ApiError(401, "INVALID_TOKEN", "Unknown role in token");
  }
  c.set("bearerToken", bearerToken);
  c.set("authUser", {
    id: claims.sub,
    email: claims.email,
    role,
  });
  await next();
};

export function requireRoles(...allowed: UserRole[]): MiddlewareHandler<ApiEnv> {
  return async (c, next) => {
    const user = c.get("authUser");
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }
    if (!allowed.includes(user.role)) {
      throw new ApiError(403, "FORBIDDEN", "Insufficient permissions for this resource");
    }
    await next();
  };
}

/** Role guard convenience wrappers for buyer/agent/developer/admin scopes. */
export const requireBuyer = requireRoles(UserRole.buyer);
export const requireAgent = requireRoles(UserRole.agent);
export const requireDeveloper = requireRoles(UserRole.developer);
export const requireAdmin = requireRoles(UserRole.admin, UserRole.super_admin);
export const requireAgentOrDeveloper = requireRoles(
  UserRole.agent,
  UserRole.developer,
);
export const requireStaff = requireRoles(
  UserRole.agent,
  UserRole.developer,
  UserRole.admin,
  UserRole.super_admin,
);

export function isAdminRole(role: UserRole | string | undefined): boolean {
  return role === UserRole.admin || role === UserRole.super_admin;
}
