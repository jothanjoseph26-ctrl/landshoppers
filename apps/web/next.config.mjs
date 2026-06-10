/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is for Docker/ECS only — Vercel uses its own output layout.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
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
}

export default nextConfig
