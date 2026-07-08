-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'LOGIN', 'LOGOUT', 'CALLBACK_RECEIVED', 'CALLBACK_PROCESSED', 'TRACKING_REDIRECT', 'STATUS_CHANGE', 'SECURITY_EVENT');

-- CreateEnum
CREATE TYPE "FraudSignalType" AS ENUM ('DUPLICATE_SUPPLIER_RESPONDENT', 'DUPLICATE_IP', 'RAPID_COMPLETION', 'MULTIPLE_OUTCOMES', 'SECURITY_CALLBACK', 'SUSPICIOUS_USER_AGENT');

-- CreateEnum
CREATE TYPE "FraudSignalSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FraudSignalStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "action" "AuditActionType" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "message" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudSignal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "supplierId" TEXT,
    "projectSupplierId" TEXT,
    "respondentSessionId" TEXT,
    "type" "FraudSignalType" NOT NULL,
    "severity" "FraudSignalSeverity" NOT NULL DEFAULT 'LOW',
    "status" "FraudSignalStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "FraudSignal_organizationId_idx" ON "FraudSignal"("organizationId");

-- CreateIndex
CREATE INDEX "FraudSignal_projectId_idx" ON "FraudSignal"("projectId");

-- CreateIndex
CREATE INDEX "FraudSignal_supplierId_idx" ON "FraudSignal"("supplierId");

-- CreateIndex
CREATE INDEX "FraudSignal_projectSupplierId_idx" ON "FraudSignal"("projectSupplierId");

-- CreateIndex
CREATE INDEX "FraudSignal_respondentSessionId_idx" ON "FraudSignal"("respondentSessionId");

-- CreateIndex
CREATE INDEX "FraudSignal_type_idx" ON "FraudSignal"("type");

-- CreateIndex
CREATE INDEX "FraudSignal_severity_idx" ON "FraudSignal"("severity");

-- CreateIndex
CREATE INDEX "FraudSignal_status_idx" ON "FraudSignal"("status");

-- CreateIndex
CREATE INDEX "FraudSignal_createdAt_idx" ON "FraudSignal"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudSignal" ADD CONSTRAINT "FraudSignal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudSignal" ADD CONSTRAINT "FraudSignal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudSignal" ADD CONSTRAINT "FraudSignal_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudSignal" ADD CONSTRAINT "FraudSignal_projectSupplierId_fkey" FOREIGN KEY ("projectSupplierId") REFERENCES "ProjectSupplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudSignal" ADD CONSTRAINT "FraudSignal_respondentSessionId_fkey" FOREIGN KEY ("respondentSessionId") REFERENCES "RespondentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
