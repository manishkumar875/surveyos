import { Router } from 'express';
import { z } from 'zod';
import {
  prisma,
  ProjectSupplierStatus,
  SupplierStatus,
  ProjectStatus,
  IntegrationStatus,
  RespondentSessionStatus,
  type Prisma,
} from '@surveyos/db';

export const trackingRouter: Router = Router();

const trackingParamsSchema = z.object({
  trackingToken: z.string().uuid('Invalid tracking token'),
});

// Redirect Endpoint
trackingRouter.get('/:trackingToken', (req, res) => {
  void (async () => {
    try {
      const paramsResult = trackingParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(404).json({ success: false, error: 'Tracking link not found' });
      }

      const { trackingToken } = paramsResult.data;

      const projectSupplier = await prisma.projectSupplier.findUnique({
        where: { trackingToken },
        include: {
          project: {
            include: {
              integration: true,
            },
          },
          supplier: true,
          organization: true,
        },
      });

      if (!projectSupplier) {
        return res.status(404).json({ success: false, error: 'Tracking link not found' });
      }

      const { project, supplier, organization } = projectSupplier;
      const integration = project.integration;

      if (projectSupplier.status === ProjectSupplierStatus.PAUSED) {
        return res
          .status(403)
          .json({ success: false, error: 'Project supplier assignment is paused' });
      }
      if (projectSupplier.status === ProjectSupplierStatus.ARCHIVED) {
        return res
          .status(410)
          .json({ success: false, error: 'Project supplier assignment is archived' });
      }

      if (supplier.status === SupplierStatus.PAUSED) {
        return res.status(403).json({ success: false, error: 'Supplier is paused' });
      }
      if (supplier.status === SupplierStatus.ARCHIVED) {
        return res.status(410).json({ success: false, error: 'Supplier is archived' });
      }

      if (project.status === ProjectStatus.PAUSED) {
        return res.status(403).json({ success: false, error: 'Project is paused' });
      }
      if (project.status === ProjectStatus.ARCHIVED) {
        return res.status(410).json({ success: false, error: 'Project is archived' });
      }

      if (!integration) {
        return res.status(400).json({ success: false, error: 'Project integration is missing' });
      }

      if (!integration.clientSurveyUrl) {
        return res
          .status(400)
          .json({ success: false, error: 'Client survey URL is not configured' });
      }

      if (integration.status !== IntegrationStatus.LIVE) {
        return res.status(403).json({ success: false, error: 'Project integration is not live' });
      }

      // Capture request data
      const ipAddress =
        (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
      const userAgent = req.get('user-agent') || null;
      const entryUrl = `${req.protocol}://${req.get('host') ?? ''}${req.originalUrl}`;
      const queryParams = req.query;

      // Extract respondent ID
      const queryKeys = ['supplierRespondentId', 'respondentId', 'rid', 'subid'];
      let supplierRespondentId: string | null = null;

      for (const key of queryKeys) {
        if (queryParams[key] && typeof queryParams[key] === 'string') {
          supplierRespondentId = queryParams[key];
          break;
        }
      }

      const metadataJson = JSON.parse(JSON.stringify(req.query)) as Prisma.JsonObject;

      // Create RespondentSession
      const session = await prisma.respondentSession.create({
        data: {
          organizationId: organization.id,
          projectId: project.id,
          supplierId: supplier.id,
          projectSupplierId: projectSupplier.id,
          supplierRespondentId,
          status: RespondentSessionStatus.STARTED,
          ipAddress,
          userAgent,
          entryUrl,
          metadata: metadataJson,
        },
      });

      // Generate redirect URL
      const redirectUrl = new URL(integration.clientSurveyUrl);

      let paramSessionToken = 'sessionToken';
      let paramProjectId = 'projectId';
      let paramSupplierId = 'supplierId';
      let paramProjectSupplierId = 'projectSupplierId';
      let paramSupplierRespondentId = 'supplierRespondentId';

      if (
        integration.parameterMapping &&
        typeof integration.parameterMapping === 'object' &&
        !Array.isArray(integration.parameterMapping)
      ) {
        const mapping = integration.parameterMapping as Record<string, string>;
        if (mapping.sessionToken) paramSessionToken = mapping.sessionToken;
        if (mapping.projectId) paramProjectId = mapping.projectId;
        if (mapping.supplierId) paramSupplierId = mapping.supplierId;
        if (mapping.projectSupplierId) paramProjectSupplierId = mapping.projectSupplierId;
        if (mapping.supplierRespondentId) paramSupplierRespondentId = mapping.supplierRespondentId;
      }

      redirectUrl.searchParams.set(paramSessionToken, session.sessionToken);
      redirectUrl.searchParams.set(paramProjectId, project.id);
      redirectUrl.searchParams.set(paramSupplierId, supplier.id);
      redirectUrl.searchParams.set(paramProjectSupplierId, projectSupplier.id);

      if (supplierRespondentId) {
        redirectUrl.searchParams.set(paramSupplierRespondentId, supplierRespondentId);
      }

      const finalRedirectUrl = redirectUrl.toString();

      await prisma.respondentSession.update({
        where: { id: session.id },
        data: {
          status: RespondentSessionStatus.REDIRECTED,
          redirectUrl: finalRedirectUrl,
          redirectedAt: new Date(),
        },
      });

      return res.redirect(302, finalRedirectUrl);
    } catch (error) {
      console.error('Error tracking respondent:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});
