-- Developer portal KYC documents (slice 3 MVP: metadata + external HTTPS URL until S3).

CREATE TYPE "DeveloperKycDocumentType" AS ENUM ('c_of_o', 'survey', 'governor_consent', 'cac', 'tax_clearance', 'other');

CREATE TYPE "DeveloperKycDocumentStatus" AS ENUM ('pending', 'verified', 'rejected', 'expired');

CREATE TABLE "developer_kyc_documents" (
    "id" UUID NOT NULL,
    "developerId" UUID NOT NULL,
    "projectId" UUID,
    "documentType" "DeveloperKycDocumentType" NOT NULL,
    "status" "DeveloperKycDocumentStatus" NOT NULL DEFAULT 'pending',
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL DEFAULT 0,
    "storageKey" TEXT,
    "externalUrl" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developer_kyc_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "developer_kyc_documents_developerId_idx" ON "developer_kyc_documents"("developerId");

CREATE INDEX "developer_kyc_documents_projectId_idx" ON "developer_kyc_documents"("projectId");

CREATE INDEX "developer_kyc_documents_status_idx" ON "developer_kyc_documents"("status");

ALTER TABLE "developer_kyc_documents" ADD CONSTRAINT "developer_kyc_documents_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_kyc_documents" ADD CONSTRAINT "developer_kyc_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
