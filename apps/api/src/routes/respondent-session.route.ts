import { Router } from 'express';
import { z } from 'zod';
import { prisma, RespondentSessionStatus, type Prisma } from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const respondentSessionRouter: Router = Router({ mergeParams: true });

const organizationParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
});

const listSessionsQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  projectSupplierId: z.string().uuid().optional(),
  status: z
    .enum([
      RespondentSessionStatus.STARTED,
      RespondentSessionStatus.REDIRECTED,
      RespondentSessionStatus.COMPLETED,
      RespondentSessionStatus.TERMINATED,
      RespondentSessionStatus.QUOTA_FULL,
      RespondentSessionStatus.SECURITY,
      RespondentSessionStatus.ABANDONED,
    ])
    .optional(),
  supplierRespondentId: z.string().optional(),
  sessionToken: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

// List Respondent Sessions
// eslint-disable-next-line @typescript-eslint/no-misused-promises
respondentSessionRouter.get('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = organizationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid organization ID',
          details: paramsResult.error.errors,
        });
      }

      const queryResult = listSessionsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;
      const {
        page,
        limit,
        projectId,
        supplierId,
        projectSupplierId,
        status,
        supplierRespondentId,
        sessionToken,
      } = queryResult.data;
      const requestingUserId = req.user.id;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const whereClause: Prisma.RespondentSessionWhereInput = {
        organizationId,
      };

      if (projectId) whereClause.projectId = projectId;
      if (supplierId) whereClause.supplierId = supplierId;
      if (projectSupplierId) whereClause.projectSupplierId = projectSupplierId;
      if (status) whereClause.status = status;
      if (supplierRespondentId) whereClause.supplierRespondentId = supplierRespondentId;
      if (sessionToken) whereClause.sessionToken = sessionToken;

      const skip = (page - 1) * limit;

      const [total, sessions] = await Promise.all([
        prisma.respondentSession.count({ where: whereClause }),
        prisma.respondentSession.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            project: {
              select: { id: true, name: true, status: true, clientName: true },
            },
            supplier: {
              select: { id: true, name: true, status: true },
            },
            projectSupplier: {
              select: { id: true, status: true },
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const formattedSessions = sessions.map((session) => ({
        id: session.id,
        organizationId: session.organizationId,
        projectId: session.projectId,
        supplierId: session.supplierId,
        projectSupplierId: session.projectSupplierId,
        sessionToken: session.sessionToken,
        supplierRespondentId: session.supplierRespondentId,
        status: session.status,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        entryUrl: session.entryUrl,
        redirectUrl: session.redirectUrl,
        startedAt: session.startedAt,
        redirectedAt: session.redirectedAt,
        completedAt: session.completedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        project: session.project,
        supplier: session.supplier,
        projectSupplier: session.projectSupplier,
      }));

      return res.status(200).json({
        success: true,
        data: formattedSessions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Error listing respondent sessions:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

const getSessionParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  sessionId: z.string().uuid('Invalid session ID'),
});

// Get Session Details
// eslint-disable-next-line @typescript-eslint/no-misused-promises
respondentSessionRouter.get('/:sessionId', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = getSessionParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, sessionId } = paramsResult.data;
      const requestingUserId = req.user.id;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const session = await prisma.respondentSession.findFirst({
        where: {
          id: sessionId,
          organizationId,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              clientName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              contactName: true,
              email: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          projectSupplier: {
            select: { id: true, status: true, notes: true, createdAt: true, updatedAt: true },
          },
        },
      });

      if (!session) {
        return res.status(404).json({ success: false, error: 'Respondent session not found' });
      }

      const responseData = {
        id: session.id,
        organizationId: session.organizationId,
        projectId: session.projectId,
        supplierId: session.supplierId,
        projectSupplierId: session.projectSupplierId,
        sessionToken: session.sessionToken,
        supplierRespondentId: session.supplierRespondentId,
        status: session.status,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        entryUrl: session.entryUrl,
        redirectUrl: session.redirectUrl,
        metadata: session.metadata,
        startedAt: session.startedAt,
        redirectedAt: session.redirectedAt,
        completedAt: session.completedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        project: session.project,
        supplier: session.supplier,
        projectSupplier: session.projectSupplier,
      };

      return res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error('Error fetching respondent session details:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});
