import { Hono } from "hono";

import { prisma } from "../lib/prisma.js";
import type { ApiEnv } from "../types/env.js";

const startedAt = Date.now();

export const healthRoutes = new Hono<ApiEnv>();

healthRoutes.get("/", (c) => {
  return c.json({
    data: {
      status: "ok",
      service: "landshoppers-api",
      uptimeMs: Date.now() - startedAt,
    },
  });
});

healthRoutes.get("/ready", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({
      data: {
        status: "ready",
        database: "ok",
      },
    });
  } catch {
    return c.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Database connection failed",
        },
      },
      503,
    );
  }
});
