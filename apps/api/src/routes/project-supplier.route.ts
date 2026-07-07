import { Router } from 'express';
import { z } from 'zod';
import {
  prisma,
  Role,
  ProjectSupplierStatus,
  type Prisma,
  type ProjectSupplier,
  type Supplier,
} from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

export const projectSupplierRouter: Router = Router({ mergeParams: true });

const projectSupplierParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  projectId: z.string().uuid('Invalid project ID'),
});

const projectSupplierDetailsParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  projectId: z.string().uuid('Invalid project ID'),
  projectSupplierId: z.string().uuid('Invalid project supplier ID'),
});

const createProjectSupplierSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID'),
  status: z.nativeEnum(ProjectSupplierStatus).optional(),
  notes: z.string().optional().nullable(),
});

const listProjectSuppliersQuerySchema = z.object({
  status: z.nativeEnum(ProjectSupplierStatus).optional(),
  search: z.string().optional(),
});

type ProjectSupplierWithSupplier = ProjectSupplier & {
  supplier: Pick<Supplier, 'id' | 'name' | 'contactName' | 'email' | 'status'>;
};

const formatProjectSupplierResponse = (projectSupplier: ProjectSupplierWithSupplier) => {
  return {
    ...projectSupplier,
    trackingUrl: `${env.API_PUBLIC_URL}/track/${projectSupplier.trackingToken}`,
  };
};

// Assign Supplier to Project
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectSupplierRouter.post('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = projectSupplierParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const bodyResult = createProjectSupplierSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
      const { supplierId, status, notes } = bodyResult.data;
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
          error: 'Forbidden: Insufficient permissions to assign suppliers to projects',
        });
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId },
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, organizationId },
      });

      if (!supplier) {
        return res.status(404).json({ success: false, error: 'Supplier not found' });
      }

      const existingAssignment = await prisma.projectSupplier.findUnique({
        where: {
          projectId_supplierId: {
            projectId,
            supplierId,
          },
        },
      });

      if (existingAssignment) {
        return res
          .status(409)
          .json({ success: false, error: 'Supplier is already assigned to this project' });
      }

      const projectSupplier = await prisma.projectSupplier.create({
        data: {
          organizationId,
          projectId,
          supplierId,
          status: status || ProjectSupplierStatus.ACTIVE,
          notes: notes || null,
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              contactName: true,
              email: true,
              status: true,
            },
          },
        },
      });

      return res
        .status(201)
        .json({ success: true, data: formatProjectSupplierResponse(projectSupplier) });
    } catch (error) {
      console.error('Error assigning supplier to project:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// List Project Suppliers
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectSupplierRouter.get('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = projectSupplierParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const queryResult = listProjectSuppliersQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
      const { status, search } = queryResult.data;
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

      const whereClause: Prisma.ProjectSupplierWhereInput = {
        organizationId,
        projectId,
      };

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause.supplier = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { contactName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        };
      }

      const projectSuppliers = await prisma.projectSupplier.findMany({
        where: whereClause,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              contactName: true,
              email: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formattedData = projectSuppliers.map(formatProjectSupplierResponse);

      return res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
      console.error('Error listing project suppliers:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Get Project Supplier Details
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectSupplierRouter.get('/:projectSupplierId', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = projectSupplierDetailsParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, projectId, projectSupplierId } = paramsResult.data;
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

      const projectSupplier = await prisma.projectSupplier.findFirst({
        where: {
          id: projectSupplierId,
          organizationId,
          projectId,
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              contactName: true,
              email: true,
              phone: true,
              website: true,
              status: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
          },
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
        },
      });

      if (!projectSupplier) {
        return res
          .status(404)
          .json({ success: false, error: 'Project supplier assignment not found' });
      }

      const { trackingToken, ...rest } = projectSupplier;
      const formattedData = {
        ...rest,
        trackingUrl: `${env.API_PUBLIC_URL}/track/${trackingToken}`,
      };

      return res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
      console.error('Error fetching project supplier details:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});
