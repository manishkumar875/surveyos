import { Router } from 'express';
import { z } from 'zod';
import { prisma, Role } from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const organizationRouter: Router = Router();

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationRouter.post('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      const parseResult = createOrganizationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parseResult.error.errors,
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { name } = parseResult.data;
      const userId = req.user.id;

      const existingOrg = await prisma.organization.findFirst({
        where: { name },
      });

      if (existingOrg) {
        return res.status(409).json({
          success: false,
          error: 'Organization with this name already exists',
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: { name },
        });

        const membership = await tx.membership.create({
          data: {
            organizationId: organization.id,
            userId,
            role: Role.OWNER,
          },
        });

        return { organization, membership };
      });

      return res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred',
      });
    }
  })();
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationRouter.get('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const memberships = await prisma.membership.findMany({
        where: {
          userId: req.user.id,
        },
        include: {
          organization: true,
        },
        orderBy: {
          organization: {
            createdAt: 'desc',
          },
        },
      });

      const organizations = memberships.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        createdAt: membership.organization.createdAt,
        updatedAt: membership.organization.updatedAt,
        membershipId: membership.id,
        role: membership.role,
      }));

      return res.status(200).json({
        success: true,
        data: organizations,
      });
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred',
      });
    }
  })();
});

const getOrganizationParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationRouter.get('/:organizationId', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const parseResult = getOrganizationParamsSchema.safeParse(req.params);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parseResult.error.errors,
        });
      }

      const { organizationId } = parseResult.data;

      const membership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: req.user.id,
        },
        include: {
          organization: true,
        },
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
      }

      const responseData = {
        id: membership.organization.id,
        name: membership.organization.name,
        createdAt: membership.organization.createdAt,
        updatedAt: membership.organization.updatedAt,
        membershipId: membership.id,
        role: membership.role,
      };

      return res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error('Error fetching organization details:', error);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred',
      });
    }
  })();
});
