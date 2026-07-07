-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('WAITING', 'TESTING', 'LIVE', 'FAILED');

-- CreateTable
CREATE TABLE "ProjectIntegration" (
    "id" TEXT NOT NULL,
    "clientSurveyUrl" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'WAITING',
    "parameterMapping" JSONB,
    "completeCallbackToken" TEXT NOT NULL,
    "terminateCallbackToken" TEXT NOT NULL,
    "quotaFullCallbackToken" TEXT NOT NULL,
    "securityCallbackToken" TEXT NOT NULL,
    "testCallbackToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectIntegration_completeCallbackToken_key" ON "ProjectIntegration"("completeCallbackToken");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectIntegration_terminateCallbackToken_key" ON "ProjectIntegration"("terminateCallbackToken");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectIntegration_quotaFullCallbackToken_key" ON "ProjectIntegration"("quotaFullCallbackToken");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectIntegration_securityCallbackToken_key" ON "ProjectIntegration"("securityCallbackToken");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectIntegration_testCallbackToken_key" ON "ProjectIntegration"("testCallbackToken");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectIntegration_projectId_key" ON "ProjectIntegration"("projectId");

-- CreateIndex
CREATE INDEX "ProjectIntegration_projectId_idx" ON "ProjectIntegration"("projectId");

-- CreateIndex
CREATE INDEX "ProjectIntegration_status_idx" ON "ProjectIntegration"("status");

-- CreateIndex
CREATE INDEX "ProjectIntegration_createdAt_idx" ON "ProjectIntegration"("createdAt");

-- AddForeignKey
ALTER TABLE "ProjectIntegration" ADD CONSTRAINT "ProjectIntegration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
