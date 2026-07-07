-- CreateEnum
CREATE TYPE "ProjectSupplierStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ProjectSupplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "ProjectSupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "trackingToken" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSupplier_trackingToken_key" ON "ProjectSupplier"("trackingToken");

-- CreateIndex
CREATE INDEX "ProjectSupplier_organizationId_idx" ON "ProjectSupplier"("organizationId");

-- CreateIndex
CREATE INDEX "ProjectSupplier_projectId_idx" ON "ProjectSupplier"("projectId");

-- CreateIndex
CREATE INDEX "ProjectSupplier_supplierId_idx" ON "ProjectSupplier"("supplierId");

-- CreateIndex
CREATE INDEX "ProjectSupplier_status_idx" ON "ProjectSupplier"("status");

-- CreateIndex
CREATE INDEX "ProjectSupplier_trackingToken_idx" ON "ProjectSupplier"("trackingToken");

-- CreateIndex
CREATE INDEX "ProjectSupplier_createdAt_idx" ON "ProjectSupplier"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSupplier_projectId_supplierId_key" ON "ProjectSupplier"("projectId", "supplierId");

-- AddForeignKey
ALTER TABLE "ProjectSupplier" ADD CONSTRAINT "ProjectSupplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSupplier" ADD CONSTRAINT "ProjectSupplier_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSupplier" ADD CONSTRAINT "ProjectSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
