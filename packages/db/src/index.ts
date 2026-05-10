import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

export { PrismaClient };

export function createPrismaClient() {
  /** Neon: prefer pooled `DATABASE_URL` at runtime; fall back to `DIRECT_URL` if only that is set (e.g. Railway). */
  const connectionString =
    process.env["DATABASE_URL"] ?? process.env["DIRECT_URL"];

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or DIRECT_URL is required to create PrismaClient",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}
