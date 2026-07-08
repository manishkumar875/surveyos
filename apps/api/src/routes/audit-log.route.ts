/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma, Role, AuditActionType, type Prisma } from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const auditLogRouter: Router = Router({ mergeParams: true });

const organizationParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
});

const auditLogParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  auditLogId: z.string().uuid('Invalid audit log ID'),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
});

const auditLogFilterSchema = paginationQuerySchema.extend({
  action: z.nativeEnum(AuditActionType).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// List Audit Logs
auditLogRouter.get('/', authMiddleware, (req: Request, res: Response) => {
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

      const queryResult = auditLogFilterSchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;
      const { page, limit, action, entityType, entityId, userId, from, to } = queryResult.data;
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

      const where: Prisma.AuditLogWhereInput = {
        organizationId,
        ...(action && { action }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(userId && { userId }),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      };

      const [total, data] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            organizationId: true,
            userId: true,
            action: true,
            entityType: true,
            entityId: true,
            message: true,
            ipAddress: true,
            userAgent: true,
            metadata: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: data.map((log) => ({
          ...log,
          user: log.user
            ? {
                id: log.user.id,
                name: `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim(),
                email: log.user.email,
              }
            : null,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Get Audit Log Details
auditLogRouter.get('/:auditLogId', authMiddleware, (req: Request, res: Response) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = auditLogParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, auditLogId } = paramsResult.data;
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

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          id: auditLogId,
          organizationId,
        },
        select: {
          id: true,
          organizationId: true,
          userId: true,
          action: true,
          entityType: true,
          entityId: true,
          message: true,
          ipAddress: true,
          userAgent: true,
          metadata: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });

      if (!auditLog) {
        return res.status(404).json({ success: false, error: 'Audit log not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...auditLog,
          user: auditLog.user
            ? {
                id: auditLog.user.id,
                name: `${auditLog.user.firstName || ''} ${auditLog.user.lastName || ''}`.trim(),
                email: auditLog.user.email,
                createdAt: auditLog.user.createdAt,
              }
            : null,
        },
      });
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});
