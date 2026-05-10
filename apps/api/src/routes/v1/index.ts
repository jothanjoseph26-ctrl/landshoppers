import { Hono } from "hono";

import { optionalBearer } from "../../middleware/auth.js";
import type { ApiEnv } from "../../types/env.js";
import { adminSeoV1 } from "./admin-seo.js";
import { adminWhatsappV1 } from "./admin-whatsapp.js";
import { adminV1 } from "./admin.js";
import { agentScopedV1 } from "./agent.js";
import { agentsV1 } from "./agents.js";
import { authV1 } from "./auth.js";
import { developersCatalogV1 } from "./developers-catalog.js";
import { projectsCatalogV1 } from "./projects-catalog.js";
import { inquiriesV1 } from "./inquiries.js";
import { listingsV1 } from "./listings.js";
import { meV1 } from "./me.js";
import { searchV1 } from "./search.js";
import { whatsappPublicV1 } from "./whatsapp.js";

export const v1Routes = new Hono<ApiEnv>();

v1Routes.use("*", optionalBearer);

v1Routes.route("/whatsapp", whatsappPublicV1);
v1Routes.route("/agents", agentsV1);
v1Routes.route("/agent", agentScopedV1);
v1Routes.route("/admin/whatsapp", adminWhatsappV1);
v1Routes.route("/admin/seo", adminSeoV1);
v1Routes.route("/admin", adminV1);
v1Routes.route("/auth", authV1);
v1Routes.route("/me", meV1);
v1Routes.route("/inquiries", inquiriesV1);
v1Routes.route("/listings", listingsV1);
v1Routes.route("/search", searchV1);
v1Routes.route("/developers", developersCatalogV1);
v1Routes.route("/projects", projectsCatalogV1);
