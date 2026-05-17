import type { Prisma } from "@landshoppers/db";

import { prisma } from "./prisma.js";

/** Scalar UserProfile fields safe for both create and update (no relations). */
export type UserProfileScalarPatch = Partial<
  Pick<
    Prisma.UserProfileUncheckedCreateInput,
    | "firstName"
    | "lastName"
    | "avatarUrl"
    | "city"
    | "state"
    | "country"
    | "preferences"
    | "notifyEmail"
    | "notifySms"
    | "notifyPush"
  >
>;

export async function patchUserProfileScalars(
  userId: string,
  hasProfile: boolean,
  patch: UserProfileScalarPatch,
): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  if (hasProfile) {
    await prisma.userProfile.update({ where: { userId }, data: patch });
  } else {
    await prisma.userProfile.create({ data: { userId, ...patch } });
  }
}
