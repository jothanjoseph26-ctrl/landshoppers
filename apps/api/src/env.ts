import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Load monorepo root `.env` when running from `apps/api`. */
config({ path: resolve(__dirname, "../../../.env") });
