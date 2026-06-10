import { Hono } from "hono";

import { app as landshoppersApi } from "./app.js";

/** Vercel / Next.js route handler mount — exposes `/api/v1/*`, `/api/health`, etc. */
export const vercelApp = new Hono();
vercelApp.route("/api", landshoppersApi);
