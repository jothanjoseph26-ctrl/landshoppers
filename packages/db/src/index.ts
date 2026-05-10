import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

export { PrismaClient };

export function createPrismaClient() {
  const connectionString = process.env["DATABASE_URL"];

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create PrismaClient");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}
