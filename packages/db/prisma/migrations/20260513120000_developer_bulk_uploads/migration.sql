-- Bulk inventory CSV staging for developer portal (slice 1).

CREATE TYPE "DeveloperBulkUploadStatus" AS ENUM ('mapping', 'validating', 'ready', 'committed', 'failed');

CREATE TABLE "developer_bulk_uploads" (
    "id" UUID NOT NULL,
    "developerId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "status" "DeveloperBulkUploadStatus" NOT NULL DEFAULT 'mapping',
    "errorMessage" TEXT,
    "headers" JSONB NOT NULL,
    "parsedGrid" JSONB NOT NULL,
    "columnMap" JSONB,
    "commitMode" TEXT,
    "committedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developer_bulk_uploads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "developer_bulk_upload_rows" (
    "id" UUID NOT NULL,
    "uploadId" UUID NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "errors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "warnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "developer_bulk_upload_rows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "developer_bulk_upload_rows_uploadId_rowIndex_key" ON "developer_bulk_upload_rows"("uploadId", "rowIndex");

CREATE INDEX "developer_bulk_upload_rows_uploadId_idx" ON "developer_bulk_upload_rows"("uploadId");

CREATE INDEX "developer_bulk_uploads_developerId_idx" ON "developer_bulk_uploads"("developerId");

CREATE INDEX "developer_bulk_uploads_projectId_idx" ON "developer_bulk_uploads"("projectId");

CREATE INDEX "developer_bulk_uploads_status_idx" ON "developer_bulk_uploads"("status");

ALTER TABLE "developer_bulk_uploads" ADD CONSTRAINT "developer_bulk_uploads_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_bulk_uploads" ADD CONSTRAINT "developer_bulk_uploads_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_bulk_upload_rows" ADD CONSTRAINT "developer_bulk_upload_rows_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "developer_bulk_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
