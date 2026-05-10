import { Hono } from "hono";

import { optionalBearer } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";
import { agentsV1 } from "./agents.js";
import { authV1 } from "./auth.js";
import { listingsV1 } from "./listings.js";
import { meV1 } from "./me.js";
import { searchV1 } from "./search.js";

export const v1Routes = new Hono<ApiEnv>();

v1Routes.use("*", optionalBearer);

v1Routes.route("/agents", agentsV1);
v1Routes.route("/auth", authV1);
v1Routes.route("/me", meV1);
v1Routes.route("/listings", listingsV1);
v1Routes.route("/search", searchV1);
