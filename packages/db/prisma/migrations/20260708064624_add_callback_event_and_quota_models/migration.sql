-- CreateEnum
CREATE TYPE "CallbackOutcomeType" AS ENUM ('COMPLETE', 'TERMINATE', 'QUOTA_FULL', 'SECURITY', 'TEST');

-- CreateEnum
CREATE TYPE "CallbackEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "QuotaStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FULL', 'ARCHIVED');

-- CreateTable
CREATE TABLE "CallbackEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectIntegrationId" TEXT NOT NULL,
    "respondentSessionId" TEXT,
    "outcome" "CallbackOutcomeType" NOT NULL,
    "status" "CallbackEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "sessionToken" TEXT,
    "supplierRespondentId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "rawQuery" JSONB,
    "rawBody" JSONB,
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallbackEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectQuota" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetCompletes" INTEGER NOT NULL,
    "currentCompletes" INTEGER NOT NULL DEFAULT 0,
    "status" "QuotaStatus" NOT NULL DEFAULT 'ACTIVE',
    "criteria" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallbackEvent_organizationId_idx" ON "CallbackEvent"("organizationId");

-- CreateIndex
CREATE INDEX "CallbackEvent_projectId_idx" ON "CallbackEvent"("projectId");

-- CreateIndex
CREATE INDEX "CallbackEvent_projectIntegrationId_idx" ON "CallbackEvent"("projectIntegrationId");

-- CreateIndex
CREATE INDEX "CallbackEvent_respondentSessionId_idx" ON "CallbackEvent"("respondentSessionId");

-- CreateIndex
CREATE INDEX "CallbackEvent_sessionToken_idx" ON "CallbackEvent"("sessionToken");

-- CreateIndex
CREATE INDEX "CallbackEvent_outcome_idx" ON "CallbackEvent"("outcome");

-- CreateIndex
CREATE INDEX "CallbackEvent_status_idx" ON "CallbackEvent"("status");

-- CreateIndex
CREATE INDEX "CallbackEvent_receivedAt_idx" ON "CallbackEvent"("receivedAt");

-- CreateIndex
CREATE INDEX "CallbackEvent_createdAt_idx" ON "CallbackEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ProjectQuota_organizationId_idx" ON "ProjectQuota"("organizationId");

-- CreateIndex
CREATE INDEX "ProjectQuota_projectId_idx" ON "ProjectQuota"("projectId");

-- CreateIndex
CREATE INDEX "ProjectQuota_status_idx" ON "ProjectQuota"("status");

-- CreateIndex
CREATE INDEX "ProjectQuota_createdAt_idx" ON "ProjectQuota"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectQuota_projectId_name_key" ON "ProjectQuota"("projectId", "name");

-- AddForeignKey
ALTER TABLE "CallbackEvent" ADD CONSTRAINT "CallbackEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallbackEvent" ADD CONSTRAINT "CallbackEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallbackEvent" ADD CONSTRAINT "CallbackEvent_projectIntegrationId_fkey" FOREIGN KEY ("projectIntegrationId") REFERENCES "ProjectIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallbackEvent" ADD CONSTRAINT "CallbackEvent_respondentSessionId_fkey" FOREIGN KEY ("respondentSessionId") REFERENCES "RespondentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectQuota" ADD CONSTRAINT "ProjectQuota_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectQuota" ADD CONSTRAINT "ProjectQuota_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
