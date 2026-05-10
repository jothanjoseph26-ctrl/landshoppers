import type { UserRole } from "@landshoppers/db";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type ApiVariables = {
  bearerToken: string | undefined;
  authUser?: AuthUser;
};

export type ApiEnv = {
  Variables: ApiVariables;
};
