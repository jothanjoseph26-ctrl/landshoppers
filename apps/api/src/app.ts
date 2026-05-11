import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ZodError } from "zod";

import { ApiError } from "./lib/errors.js";
import { healthRoutes } from "./routes/health.js";
import { v1Routes } from "./routes/v1/index.js";
import type { ApiEnv } from "./types/env.js";

function corsOrigins(): string[] {
  const configured = [
    ...(process.env["CORS_ORIGINS"]?.split(",") ?? []),
    process.env["NEXT_PUBLIC_APP_URL"],
  ]
    .map((s) => s?.trim().replace(/\/$/, ""))
    .filter((s): s is string => Boolean(s));

  if (configured.length > 0) {
    return [...new Set(configured)];
  }

  return ["http://localhost:3000", "http://127.0.0.1:3000"];
}

export const app = new Hono<ApiEnv>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: corsOrigins(),
    allowHeaders: ["Authorization", "Content-Type"],
    exposeHeaders: [],
  }),
);

app.route("/health", healthRoutes);
app.route("/v1", v1Routes);

app.get("/", (c) =>
  c.json({
    data: {
      service: "landshoppers-api",
      docs: "See /health and /v1 routes.",
    },
  }),
);

app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: `No route for ${c.req.path}` } }, 404),
);

app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: err.flatten(),
        },
      },
      400,
    );
  }
  if (err instanceof ApiError) {
    return new Response(JSON.stringify({ error: err.toBody() }), {
      status: err.status,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
  console.error(err);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500,
  );
});

export function listen(port: number) {
  return serve({ fetch: app.fetch, hostname: "0.0.0.0", port });
}
