import type { Agent, Developer, ServiceProvider, User, UserProfile } from "@landshoppers/db";

export type MeUser = User & {
  profile: UserProfile | null;
  agent: Agent | null;
  developer: Developer | null;
  serviceProvider: ServiceProvider | null;
};

/** Shared `/v1/me` and `/v1/auth/me` response shape. */
export function meToJson(user: MeUser) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    phone: user.phone,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    profile: user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          city: user.profile.city,
          state: user.profile.state,
          country: user.profile.country,
          avatarUrl: user.profile.avatarUrl,
        }
      : null,
    agent: user.agent
      ? {
          id: user.agent.id,
          agencyName: user.agent.agencyName,
          isVerified: user.agent.isVerified,
        }
      : null,
    developer: user.developer
      ? {
          id: user.developer.id,
          companyName: user.developer.companyName,
          isVerified: user.developer.isVerified,
        }
      : null,
    serviceProvider: user.serviceProvider
      ? {
          id: user.serviceProvider.id,
          businessName: user.serviceProvider.businessName,
          slug: user.serviceProvider.slug,
        }
      : null,
  };
}
