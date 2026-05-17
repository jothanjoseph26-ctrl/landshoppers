import "./env.js";

import { listen } from "./app.js";

const portRaw = (process.env["PORT"] || process.env["API_PORT"] || "4001").trim();
const PORT = Number(portRaw) > 0 ? Number(portRaw) : 4001;

listen(PORT);
console.log(`@landshoppers/api listening on http://localhost:${PORT}`);
