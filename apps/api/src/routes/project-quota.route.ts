import { Router } from 'express';
import { z } from 'zod';
import { prisma, Role, QuotaStatus, Prisma } from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const projectQuotaRouter: Router = Router({ mergeParams: true });

const projectQuotaParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  projectId: z.string().uuid('Invalid project ID'),
});

const createProjectQuotaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  targetCompletes: z.number().int().positive('targetCompletes must be a positive integer'),
  status: z.nativeEnum(QuotaStatus).optional(),
  criteria: z.record(z.any()).optional().nullable(),
});

const listProjectQuotasQuerySchema = z.object({
  status: z.nativeEnum(QuotaStatus).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('25'),
});

// Assign Quota to Project
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectQuotaRouter.post('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = projectQuotaParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const bodyResult = createProjectQuotaSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
      const { name, description, targetCompletes, status, criteria } = bodyResult.data;
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
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to create quotas',
        });
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId },
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const existingQuota = await prisma.projectQuota.findUnique({
        where: {
          projectId_name: {
            projectId,
            name,
          },
        },
      });

      if (existingQuota) {
        return res
          .status(409)
          .json({ success: false, error: 'Quota with this name already exists in this project' });
      }

      const projectQuota = await prisma.projectQuota.create({
        data: {
          organizationId,
          projectId,
          name,
          description: description || null,
          targetCompletes,
          status: status || QuotaStatus.ACTIVE,
          criteria: criteria ? (criteria as Prisma.InputJsonValue) : Prisma.JsonNull,
          currentCompletes: 0,
        },
      });

      return res.status(201).json({ success: true, data: projectQuota });
    } catch (error) {
      console.error('Error creating project quota:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// List Project Quotas
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectQuotaRouter.get('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = projectQuotaParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const queryResult = listProjectQuotasQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
      const { status, search, page, limit } = queryResult.data;
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

      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId },
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const whereClause: Prisma.ProjectQuotaWhereInput = {
        organizationId,
        projectId,
      };

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const pageNumber = Math.max(1, page);
      const limitNumber = Math.min(100, Math.max(1, limit));
      const skip = (pageNumber - 1) * limitNumber;

      const [quotas, total] = await Promise.all([
        prisma.projectQuota.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNumber,
        }),
        prisma.projectQuota.count({ where: whereClause }),
      ]);

      return res.status(200).json({
        success: true,
        data: quotas,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error('Error listing project quotas:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});
