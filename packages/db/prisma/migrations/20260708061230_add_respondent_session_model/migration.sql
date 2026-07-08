-- CreateEnum
CREATE TYPE "RespondentSessionStatus" AS ENUM ('STARTED', 'REDIRECTED', 'COMPLETED', 'TERMINATED', 'QUOTA_FULL', 'SECURITY', 'ABANDONED');

-- CreateTable
CREATE TABLE "RespondentSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "projectSupplierId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "supplierRespondentId" TEXT,
    "status" "RespondentSessionStatus" NOT NULL DEFAULT 'STARTED',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "entryUrl" TEXT,
    "redirectUrl" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redirectedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RespondentSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RespondentSession_sessionToken_key" ON "RespondentSession"("sessionToken");

-- CreateIndex
CREATE INDEX "RespondentSession_organizationId_idx" ON "RespondentSession"("organizationId");

-- CreateIndex
CREATE INDEX "RespondentSession_projectId_idx" ON "RespondentSession"("projectId");

-- CreateIndex
CREATE INDEX "RespondentSession_supplierId_idx" ON "RespondentSession"("supplierId");

-- CreateIndex
CREATE INDEX "RespondentSession_projectSupplierId_idx" ON "RespondentSession"("projectSupplierId");

-- CreateIndex
CREATE INDEX "RespondentSession_sessionToken_idx" ON "RespondentSession"("sessionToken");

-- CreateIndex
CREATE INDEX "RespondentSession_status_idx" ON "RespondentSession"("status");

-- CreateIndex
CREATE INDEX "RespondentSession_createdAt_idx" ON "RespondentSession"("createdAt");

-- CreateIndex
CREATE INDEX "RespondentSession_startedAt_idx" ON "RespondentSession"("startedAt");

-- AddForeignKey
ALTER TABLE "RespondentSession" ADD CONSTRAINT "RespondentSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentSession" ADD CONSTRAINT "RespondentSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentSession" ADD CONSTRAINT "RespondentSession_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentSession" ADD CONSTRAINT "RespondentSession_projectSupplierId_fkey" FOREIGN KEY ("projectSupplierId") REFERENCES "ProjectSupplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
