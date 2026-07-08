import {
  prisma,
  type FraudSignalType,
  type FraudSignalSeverity,
  FraudSignalStatus,
} from '@surveyos/db';

interface CreateFraudSignalParams {
  organizationId: string;
  projectId?: string | null;
  supplierId?: string | null;
  projectSupplierId?: string | null;
  respondentSessionId?: string | null;
  type: FraudSignalType;
  severity: FraudSignalSeverity;
  reason: string;
  metadata?: unknown;
}

/**
 * Safely creates a FraudSignal without throwing exceptions.
 * Checks for duplicates based on respondentSessionId and type (if respondentSessionId is provided).
 * Alternatively, if there's a callbackEventId in metadata and no respondentSessionId, it can deduplicate on that (custom logic).
 */
export async function createFraudSignalSafely(params: CreateFraudSignalParams): Promise<void> {
  try {
    const {
      organizationId,
      projectId,
      supplierId,
      projectSupplierId,
      respondentSessionId,
      type,
      severity,
      reason,
      metadata,
    } = params;

    // Basic deduplication if respondentSessionId exists
    if (respondentSessionId) {
      const existing = await prisma.fraudSignal.findFirst({
        where: {
          respondentSessionId,
          type,
        },
      });

      if (existing) {
        return; // Avoid duplicate
      }
    } else if (metadata && typeof metadata === 'object' && 'callbackEventId' in metadata) {
      // Basic deduplication if no respondentSessionId but we have a callbackEventId
      const callbackEventId = (metadata as { callbackEventId: string }).callbackEventId;

      const existing = await prisma.fraudSignal.findFirst({
        where: {
          organizationId,
          type,
          metadata: {
            path: ['callbackEventId'],
            equals: callbackEventId,
          },
        },
      });

      if (existing) {
        return; // Avoid duplicate
      }
    }

    await prisma.fraudSignal.create({
      data: {
        organizationId,
        projectId,
        supplierId,
        projectSupplierId,
        respondentSessionId,
        type,
        severity,
        status: FraudSignalStatus.OPEN,
        reason,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    // Log the error but DO NOT throw, as fraud detection must never block the main request
    console.error(`[FraudDetection] Failed to create fraud signal (type: ${params.type}):`, error);
  }
}
