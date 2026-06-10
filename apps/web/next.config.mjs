import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(__dirname, "../..")

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is for Docker/ECS only — Vercel uses its own output layout.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
  // Include workspace packages in Vercel serverless traces (apps/api, packages/*).
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: [
    "@landshoppers/api",
    "@landshoppers/db",
    "@landshoppers/contracts",
    "@landshoppers/search-listing",
    "@landshoppers/servicehub-match",
    "@landshoppers/workers",
  ],
  serverExternalPackages: ["@prisma/client", "pg", "bcryptjs"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // apps/api uses NodeNext `import "./foo.js"` for .ts sources — map for the bundler.
      config.resolve.extensionAlias = {
        ".js": [".ts", ".tsx", ".js", ".jsx"],
        ".mjs": [".mts", ".mjs"],
      }
    }
    return config
  },
}

export default nextConfig
