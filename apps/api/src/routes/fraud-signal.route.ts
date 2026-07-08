/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  prisma,
  Role,
  FraudSignalType,
  FraudSignalSeverity,
  FraudSignalStatus,
  type Prisma,
} from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const fraudSignalRouter: Router = Router({ mergeParams: true });

const organizationParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
});

const fraudSignalParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  fraudSignalId: z.string().uuid('Invalid fraud signal ID'),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
});

const fraudSignalFilterSchema = paginationQuerySchema.extend({
  projectId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  projectSupplierId: z.string().uuid().optional(),
  respondentSessionId: z.string().uuid().optional(),
  type: z.nativeEnum(FraudSignalType).optional(),
  severity: z.nativeEnum(FraudSignalSeverity).optional(),
  status: z.nativeEnum(FraudSignalStatus).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const updateFraudSignalStatusSchema = z.object({
  status: z.enum([FraudSignalStatus.OPEN, FraudSignalStatus.REVIEWED, FraudSignalStatus.DISMISSED]),
});

// List Fraud Signals
fraudSignalRouter.get('/', authMiddleware, (req: Request, res: Response) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = organizationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const queryResult = fraudSignalFilterSchema.safeParse(req.query);
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
        respondentSessionId,
        type,
        severity,
        status,
        from,
        to,
      } = queryResult.data;
      const requestingUserId = req.user.id;

      const membership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!membership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const where: Prisma.FraudSignalWhereInput = {
        organizationId,
        ...(projectId && { projectId }),
        ...(supplierId && { supplierId }),
        ...(projectSupplierId && { projectSupplierId }),
        ...(respondentSessionId && { respondentSessionId }),
        ...(type && { type }),
        ...(severity && { severity }),
        ...(status && { status }),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      };

      const [total, data] = await Promise.all([
        prisma.fraudSignal.count({ where }),
        prisma.fraudSignal.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            organizationId: true,
            projectId: true,
            supplierId: true,
            projectSupplierId: true,
            respondentSessionId: true,
            type: true,
            severity: true,
            status: true,
            reason: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            supplier: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching fraud signals:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Get Fraud Signal Details
fraudSignalRouter.get('/:fraudSignalId', authMiddleware, (req: Request, res: Response) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = fraudSignalParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, fraudSignalId } = paramsResult.data;
      const requestingUserId = req.user.id;

      const membership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!membership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const fraudSignal = await prisma.fraudSignal.findFirst({
        where: {
          id: fraudSignalId,
          organizationId,
        },
        select: {
          id: true,
          organizationId: true,
          projectId: true,
          supplierId: true,
          projectSupplierId: true,
          respondentSessionId: true,
          type: true,
          severity: true,
          status: true,
          reason: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              clientName: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          projectSupplier: {
            select: {
              id: true,
              status: true,
            },
          },
          respondentSession: {
            select: {
              id: true,
              sessionToken: true,
              supplierRespondentId: true,
              status: true,
              ipAddress: true,
              userAgent: true,
              startedAt: true,
              redirectedAt: true,
              completedAt: true,
            },
          },
        },
      });

      if (!fraudSignal) {
        return res.status(404).json({ success: false, error: 'Fraud signal not found' });
      }

      return res.status(200).json({ success: true, data: fraudSignal });
    } catch (error) {
      console.error('Error fetching fraud signal:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Update Fraud Signal Status
fraudSignalRouter.patch('/:fraudSignalId/status', authMiddleware, (req: Request, res: Response) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = fraudSignalParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const bodyResult = updateFraudSignalStatusSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId, fraudSignalId } = paramsResult.data;
      const { status } = bodyResult.data;
      const requestingUserId = req.user.id;

      const membership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!membership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      if (membership.role === Role.MEMBER) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const existingFraudSignal = await prisma.fraudSignal.findFirst({
        where: {
          id: fraudSignalId,
          organizationId,
        },
      });

      if (!existingFraudSignal) {
        return res.status(404).json({ success: false, error: 'Fraud signal not found' });
      }

      const updatedFraudSignal = await prisma.fraudSignal.update({
        where: { id: fraudSignalId },
        data: { status },
        select: {
          id: true,
          organizationId: true,
          type: true,
          severity: true,
          status: true,
          reason: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({ success: true, data: updatedFraudSignal });
    } catch (error) {
      console.error('Error updating fraud signal:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});
