-- Platform settings singleton + provider job kanban status

CREATE TABLE "platform_settings" (
    "id" VARCHAR(32) NOT NULL,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "whatsappAutoApproveMinScore" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "platform_settings" ("id", "maintenanceMode", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

ALTER TYPE "ServiceLeadStatus" ADD VALUE IF NOT EXISTS 'in_progress';
