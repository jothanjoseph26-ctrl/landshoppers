-- Listing lifecycle: extend ListingStatus enum and add review metadata.
-- Auth hardening: add password reset token columns on users.

-- Postgres requires ALTER TYPE ... ADD VALUE outside a transaction; Prisma migrate
-- handles each statement in its own block when using `BEGIN;COMMIT;` markers, so
-- we list ADD VALUE statements as standalone DDL.

ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'pending_review' AFTER 'draft';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'rejected' AFTER 'paused';

ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "submittedAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedBy"      UUID,
  ADD COLUMN IF NOT EXISTS "rejectedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedBy"      UUID,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3);
