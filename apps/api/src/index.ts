import "./env.js";

import { listen } from "./app.js";

const PORT = Number(process.env["PORT"] ?? process.env["API_PORT"] ?? 4001);

listen(PORT);
console.log(`@landshoppers/api listening on http://localhost:${PORT}`);
