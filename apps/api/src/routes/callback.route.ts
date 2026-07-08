import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  prisma,
  CallbackOutcomeType,
  CallbackEventStatus,
  RespondentSessionStatus,
  QuotaStatus,
  type Prisma,
} from '@surveyos/db';

export const callbackRouter: Router = Router();

const callbackParamsSchema = z.object({
  token: z.string().uuid('Invalid callback token'),
});

const handleCallback = async (req: Request, res: Response, outcome: CallbackOutcomeType) => {
  try {
    const paramsResult = callbackParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(404).json({ success: false, error: 'Callback token not found' });
    }
    const { token } = paramsResult.data;

    let integrationField = '';
    switch (outcome) {
      case CallbackOutcomeType.COMPLETE:
        integrationField = 'completeCallbackToken';
        break;
      case CallbackOutcomeType.TERMINATE:
        integrationField = 'terminateCallbackToken';
        break;
      case CallbackOutcomeType.QUOTA_FULL:
        integrationField = 'quotaFullCallbackToken';
        break;
      case CallbackOutcomeType.SECURITY:
        integrationField = 'securityCallbackToken';
        break;
      case CallbackOutcomeType.TEST:
        integrationField = 'testCallbackToken';
        break;
    }

    const integration = await prisma.projectIntegration.findFirst({
      where: { [integrationField]: token },
      include: {
        project: true,
      },
    });

    if (!integration) {
      return res.status(404).json({ success: false, error: 'Callback token not found' });
    }

    const { project } = integration;

    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    const userAgent = req.get('user-agent') || null;
    const rawQuery = JSON.parse(JSON.stringify(req.query)) as Prisma.JsonObject;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rawBody =
      req.body && typeof req.body === 'object' ? JSON.parse(JSON.stringify(req.body)) : null;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload: Record<string, unknown> = {
      ...req.query,
      ...(typeof req.body === 'object' && req.body !== null ? req.body : {}),
    };

    let sessionTokenKey = 'sessionToken';
    let supplierRespondentIdKey = 'supplierRespondentId';

    if (
      integration.parameterMapping &&
      typeof integration.parameterMapping === 'object' &&
      !Array.isArray(integration.parameterMapping)
    ) {
      const mapping = integration.parameterMapping as Record<string, string>;
      if (mapping.sessionToken) sessionTokenKey = mapping.sessionToken;
      if (mapping.supplierRespondentId) supplierRespondentIdKey = mapping.supplierRespondentId;
    }

    const sessionKeys = [sessionTokenKey, 'sessionToken', 'sid', 'session_id', 'sessionId'];
    let sessionToken: string | null = null;
    for (const key of sessionKeys) {
      if (payload[key] && typeof payload[key] === 'string') {
        sessionToken = payload[key];
        break;
      }
    }

    const respondentKeys = [
      supplierRespondentIdKey,
      'supplierRespondentId',
      'respondentId',
      'rid',
      'subid',
    ];
    let supplierRespondentId: string | null = null;
    for (const key of respondentKeys) {
      if (payload[key] && typeof payload[key] === 'string') {
        supplierRespondentId = payload[key];
        break;
      }
    }

    let callbackEvent = await prisma.callbackEvent.create({
      data: {
        organizationId: project.organizationId,
        projectId: project.id,
        projectIntegrationId: integration.id,
        outcome,
        status: CallbackEventStatus.RECEIVED,
        sessionToken,
        supplierRespondentId,
        ipAddress,
        userAgent,
        rawQuery,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        rawBody,
      },
    });

    if (outcome === CallbackOutcomeType.TEST) {
      callbackEvent = await prisma.callbackEvent.update({
        where: { id: callbackEvent.id },
        data: {
          status: CallbackEventStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Test callback processed successfully',
        outcome,
        processed: true,
        callbackEventId: callbackEvent.id,
      });
    }

    if (!sessionToken) {
      callbackEvent = await prisma.callbackEvent.update({
        where: { id: callbackEvent.id },
        data: {
          status: CallbackEventStatus.FAILED,
          errorMessage: 'Missing sessionToken',
        },
      });
      return res.status(400).json({
        success: false,
        error: 'Missing sessionToken',
        outcome,
        processed: false,
        callbackEventId: callbackEvent.id,
      });
    }

    const session = await prisma.respondentSession.findFirst({
      where: {
        sessionToken,
        organizationId: project.organizationId,
        projectId: project.id,
      },
    });

    if (!session) {
      callbackEvent = await prisma.callbackEvent.update({
        where: { id: callbackEvent.id },
        data: {
          status: CallbackEventStatus.FAILED,
          errorMessage: 'Respondent session not found',
        },
      });
      return res.status(404).json({
        success: false,
        error: 'Respondent session not found',
        outcome,
        processed: false,
        callbackEventId: callbackEvent.id,
      });
    }

    callbackEvent = await prisma.callbackEvent.update({
      where: { id: callbackEvent.id },
      data: {
        respondentSessionId: session.id,
      },
    });

    const finalStatuses: RespondentSessionStatus[] = [
      RespondentSessionStatus.COMPLETED,
      RespondentSessionStatus.TERMINATED,
      RespondentSessionStatus.QUOTA_FULL,
      RespondentSessionStatus.SECURITY,
    ];

    if (finalStatuses.includes(session.status)) {
      callbackEvent = await prisma.callbackEvent.update({
        where: { id: callbackEvent.id },
        data: {
          status: CallbackEventStatus.IGNORED,
          processedAt: new Date(),
        },
      });
      return res.status(200).json({
        success: true,
        message: 'Respondent session is already in a final status',
        outcome,
        processed: false,
        callbackEventId: callbackEvent.id,
        respondentSessionId: session.id,
      });
    }

    let targetSessionStatus: RespondentSessionStatus = RespondentSessionStatus.COMPLETED;
    switch (outcome) {
      case CallbackOutcomeType.COMPLETE:
        targetSessionStatus = RespondentSessionStatus.COMPLETED;
        break;
      case CallbackOutcomeType.TERMINATE:
        targetSessionStatus = RespondentSessionStatus.TERMINATED;
        break;
      case CallbackOutcomeType.QUOTA_FULL:
        targetSessionStatus = RespondentSessionStatus.QUOTA_FULL;
        break;
      case CallbackOutcomeType.SECURITY:
        targetSessionStatus = RespondentSessionStatus.SECURITY;
        break;
    }

    let quotasUpdated = 0;
    let quotasFull = 0;

    await prisma.$transaction(async (tx) => {
      await tx.respondentSession.update({
        where: { id: session.id },
        data: {
          status: targetSessionStatus,
          completedAt: new Date(),
        },
      });

      callbackEvent = await tx.callbackEvent.update({
        where: { id: callbackEvent.id },
        data: {
          status: CallbackEventStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      if (outcome === CallbackOutcomeType.COMPLETE) {
        const activeQuotas = await tx.projectQuota.findMany({
          where: {
            organizationId: project.organizationId,
            projectId: project.id,
            status: QuotaStatus.ACTIVE,
          },
        });

        for (const quota of activeQuotas) {
          let matches = true;

          if (quota.criteria && typeof quota.criteria === 'object') {
            const criteria = quota.criteria as Record<string, unknown>;
            const sessionData: Record<string, unknown> = {
              supplierId: session.supplierId,
              projectSupplierId: session.projectSupplierId,
              supplierRespondentId: session.supplierRespondentId,
            };

            if (session.metadata && typeof session.metadata === 'object') {
              Object.assign(sessionData, session.metadata);
            }

            for (const [key, value] of Object.entries(criteria)) {
              if (sessionData[key] !== value) {
                matches = false;
                break;
              }
            }
          }

          if (matches) {
            const updatedQuota = await tx.projectQuota.update({
              where: { id: quota.id },
              data: {
                currentCompletes: {
                  increment: 1,
                },
              },
            });
            quotasUpdated++;

            if (updatedQuota.currentCompletes >= updatedQuota.targetCompletes) {
              await tx.projectQuota.update({
                where: { id: quota.id },
                data: { status: QuotaStatus.FULL },
              });
              quotasFull++;
            }
          }
        }
      }
    });

    const responsePayload: Record<string, unknown> = {
      success: true,
      message: 'Callback processed successfully',
      outcome,
      processed: true,
      callbackEventId: callbackEvent.id,
      respondentSessionId: session.id,
    };

    if (outcome === CallbackOutcomeType.COMPLETE) {
      responsePayload.quotaUpdates = {
        quotasUpdated,
        quotasFull,
      };
    } else {
      responsePayload.quotaUpdates = {
        quotasUpdated: 0,
        quotasFull: 0,
      };
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error(`Error processing callback (${outcome}):`, error);
    return res.status(500).json({ success: false, error: 'An internal server error occurred' });
  }
};

const routeMap = {
  complete: CallbackOutcomeType.COMPLETE,
  terminate: CallbackOutcomeType.TERMINATE,
  'quota-full': CallbackOutcomeType.QUOTA_FULL,
  security: CallbackOutcomeType.SECURITY,
  test: CallbackOutcomeType.TEST,
};

Object.entries(routeMap).forEach(([path, outcomeType]) => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  callbackRouter.get(`/${path}/:token`, (req, res) => handleCallback(req, res, outcomeType));
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  callbackRouter.post(`/${path}/:token`, (req, res) => handleCallback(req, res, outcomeType));
});
