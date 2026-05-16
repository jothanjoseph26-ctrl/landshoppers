-- Developer portal team: memberships + invites (slice 4 MVP).

CREATE TYPE "DeveloperTeamRole" AS ENUM ('admin', 'sales', 'marketing', 'viewer');

CREATE TABLE "developer_memberships" (
    "id" UUID NOT NULL,
    "developerId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "DeveloperTeamRole" NOT NULL,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "projectIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developer_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "developer_memberships_developerId_userId_key" ON "developer_memberships"("developerId", "userId");

CREATE INDEX "developer_memberships_developerId_idx" ON "developer_memberships"("developerId");

CREATE INDEX "developer_memberships_userId_idx" ON "developer_memberships"("userId");

ALTER TABLE "developer_memberships" ADD CONSTRAINT "developer_memberships_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_memberships" ADD CONSTRAINT "developer_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "developer_invites" (
    "id" UUID NOT NULL,
    "developerId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "DeveloperTeamRole" NOT NULL,
    "projectIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developer_invites_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "developer_invites_developerId_idx" ON "developer_invites"("developerId");

CREATE INDEX "developer_invites_tokenHash_idx" ON "developer_invites"("tokenHash");

ALTER TABLE "developer_invites" ADD CONSTRAINT "developer_invites_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_invites" ADD CONSTRAINT "developer_invites_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
