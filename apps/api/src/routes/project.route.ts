import { Router } from 'express';
import { z } from 'zod';
import { prisma, ProjectStatus, Role, type Prisma } from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const projectRouter: Router = Router({ mergeParams: true });

const organizationParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
});

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  clientName: z.string().optional().default(''),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  status: z
    .enum([
      ProjectStatus.DRAFT,
      ProjectStatus.ACTIVE,
      ProjectStatus.PAUSED,
      ProjectStatus.COMPLETED,
      ProjectStatus.ARCHIVED,
    ])
    .optional()
    .default(ProjectStatus.DRAFT),
});

const listProjectsQuerySchema = z.object({
  status: z
    .enum([
      ProjectStatus.DRAFT,
      ProjectStatus.ACTIVE,
      ProjectStatus.PAUSED,
      ProjectStatus.COMPLETED,
      ProjectStatus.ARCHIVED,
    ])
    .optional(),
  search: z.string().optional(),
});

// Create Project
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectRouter.post('/', authMiddleware, (req, res) => {
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

      const bodyResult = createProjectSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;
      const { name, description, clientName, startDate, endDate, status } = bodyResult.data;
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

      if (requestingUserMembership.role === Role.MEMBER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to create projects',
        });
      }

      const newProject = await prisma.project.create({
        data: {
          organizationId,
          createdById: requestingUserId,
          name,
          description,
          clientName,
          status,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
      });

      return res.status(201).json({
        success: true,
        data: newProject,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// List Projects
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectRouter.get('/', authMiddleware, (req, res) => {
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

      const queryResult = listProjectsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;
      const { status, search } = queryResult.data;
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

      const whereClause: Prisma.ProjectWhereInput = {
        organizationId,
      };

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { clientName: { contains: search, mode: 'insensitive' } },
        ];
      }

      const projects = await prisma.project.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      console.error('Error listing projects:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

const getProjectParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  projectId: z.string().uuid('Invalid project ID'),
});

// Get Project Details
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectRouter.get('/:projectId', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = getProjectParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
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

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
        include: {
          createdBy: true,
        },
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const { createdBy } = project;
      const createdByName =
        [createdBy.firstName, createdBy.lastName].filter(Boolean).join(' ').trim() ||
        'Unknown User';

      const responseData = {
        id: project.id,
        organizationId: project.organizationId,
        createdById: project.createdById,
        name: project.name,
        description: project.description,
        clientName: project.clientName,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        createdBy: {
          id: createdBy.id,
          name: createdByName,
          email: createdBy.email,
          createdAt: createdBy.createdAt,
        },
      };

      return res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error('Error fetching project details:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name cannot be empty').optional(),
  description: z.string().optional(),
  clientName: z.string().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  status: z
    .enum([
      ProjectStatus.DRAFT,
      ProjectStatus.ACTIVE,
      ProjectStatus.PAUSED,
      ProjectStatus.COMPLETED,
      ProjectStatus.ARCHIVED,
    ])
    .optional(),
});

// Update Project
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectRouter.patch('/:projectId', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = getProjectParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const bodyResult = updateProjectSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
      const updates = bodyResult.data;
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

      if (requestingUserMembership.role === Role.MEMBER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to update projects',
        });
      }

      const existingProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
      });

      if (!existingProject) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const dataToUpdate: Prisma.ProjectUpdateInput = {};
      if (updates.name !== undefined) dataToUpdate.name = updates.name;
      if (updates.description !== undefined) dataToUpdate.description = updates.description;
      if (updates.clientName !== undefined) dataToUpdate.clientName = updates.clientName;
      if (updates.status !== undefined) dataToUpdate.status = updates.status;
      if (updates.startDate !== undefined)
        dataToUpdate.startDate = updates.startDate ? new Date(updates.startDate) : null;
      if (updates.endDate !== undefined)
        dataToUpdate.endDate = updates.endDate ? new Date(updates.endDate) : null;

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: dataToUpdate,
      });

      return res.status(200).json({
        success: true,
        data: updatedProject,
      });
    } catch (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Archive Project
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectRouter.delete('/:projectId', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = getProjectParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
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

      if (requestingUserMembership.role === Role.MEMBER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to archive projects',
        });
      }

      const existingProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
      });

      if (!existingProject) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (existingProject.status === ProjectStatus.ARCHIVED) {
        return res.status(200).json({
          success: true,
          message: 'Project is already archived',
          project: existingProject,
        });
      }

      const archivedProject = await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.ARCHIVED },
      });

      return res.status(200).json({
        success: true,
        message: 'Project archived successfully',
        project: archivedProject,
      });
    } catch (error) {
      console.error('Error archiving project:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});
