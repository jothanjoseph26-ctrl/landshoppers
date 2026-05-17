import type { ServiceProvider, User, UserProfile } from "@landshoppers/db";

import { ApiError } from "./errors.js";
import { prisma } from "./prisma.js";

export type ProviderWithUser = ServiceProvider & {
  user: User & { profile: UserProfile | null };
};

export async function providerForUser(userId: string): Promise<ProviderWithUser> {
  const row = await prisma.serviceProvider.findFirst({
    where: { userId, deletedAt: null },
    include: { user: { include: { profile: true } } },
  });
  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Service provider profile not found");
  }
  return row;
}
