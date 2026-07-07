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

const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationRouter.patch('/:organizationId', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const paramsResult = getOrganizationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid organization ID',
          details: paramsResult.error.errors,
        });
      }

      const bodyResult = updateOrganizationSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;
      const { name } = bodyResult.data;

      const membership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: req.user.id,
        },
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
      }

      if (membership.role !== Role.OWNER && membership.role !== Role.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to update organization',
        });
      }

      const existingOrg = await prisma.organization.findFirst({
        where: { name, id: { not: organizationId } },
      });

      if (existingOrg) {
        return res.status(409).json({
          success: false,
          error: 'Organization with this name already exists',
        });
      }

      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: { name },
      });

      const responseData = {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        createdAt: updatedOrganization.createdAt,
        updatedAt: updatedOrganization.updatedAt,
        membershipId: membership.id,
        role: membership.role,
      };

      return res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: responseData,
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred',
      });
    }
  })();
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationRouter.get('/:organizationId/members', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const paramsResult = getOrganizationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid organization ID',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: req.user.id,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
      }

      if (
        requestingUserMembership.role !== Role.OWNER &&
        requestingUserMembership.role !== Role.ADMIN
      ) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to view members',
        });
      }

      const memberships = await prisma.membership.findMany({
        where: {
          organizationId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const formattedMembers = memberships.map((membership) => {
        const { user } = membership;
        const name =
          [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Unknown User';

        return {
          id: user.id,
          name,
          email: user.email,
          createdAt: user.createdAt,
          membershipId: membership.id,
          role: membership.role,
          membershipCreatedAt: membership.createdAt,
          membershipUpdatedAt: membership.updatedAt,
        };
      });

      return res.status(200).json({
        success: true,
        data: formattedMembers,
      });
    } catch (error) {
      console.error('Error fetching organization members:', error);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred',
      });
    }
  })();
});

const addMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum([Role.ADMIN, Role.MEMBER], {
    errorMap: () => ({ message: 'Role must be ADMIN or MEMBER' }),
  }),
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationRouter.post('/:organizationId/members', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const paramsResult = getOrganizationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid organization ID',
          details: paramsResult.error.errors,
        });
      }

      const bodyResult = addMemberSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;
      const { email, role: targetRole } = bodyResult.data;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: req.user.id,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
      }

      if (requestingUserMembership.role === Role.MEMBER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to add members',
        });
      }

      if (requestingUserMembership.role === Role.ADMIN && targetRole === Role.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: ADMIN cannot add other ADMIN members',
        });
      }

      const targetUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const existingMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: targetUser.id,
        },
      });

      if (existingMembership) {
        return res.status(409).json({
          success: false,
          error: 'User is already a member of this organization',
        });
      }

      const newMembership = await prisma.membership.create({
        data: {
          organizationId,
          userId: targetUser.id,
          role: targetRole,
        },
      });

      const name =
        [targetUser.firstName, targetUser.lastName].filter(Boolean).join(' ').trim() ||
        'Unknown User';

      const responseData = {
        membershipId: newMembership.id,
        role: newMembership.role,
        createdAt: newMembership.createdAt,
        updatedAt: newMembership.updatedAt,
        user: {
          id: targetUser.id,
          name,
          email: targetUser.email,
          createdAt: targetUser.createdAt,
        },
      };

      return res.status(201).json({
        success: true,
        message: 'Member added successfully',
        data: responseData,
      });
    } catch (error) {
      console.error('Error adding organization member:', error);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred',
      });
    }
  })();
});

const updateMemberParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  membershipId: z.string().uuid('Invalid membership ID'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum([Role.ADMIN, Role.MEMBER], {
    errorMap: () => ({ message: 'Role must be ADMIN or MEMBER' }),
  }),
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationRouter.patch('/:organizationId/members/:membershipId', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const paramsResult = updateMemberParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const bodyResult = updateMemberRoleSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId, membershipId } = paramsResult.data;
      const { role: newRole } = bodyResult.data;
      const requestingUserId = req.user.id;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
      }

      if (requestingUserMembership.role === Role.MEMBER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions',
        });
      }

      const targetMembership = await prisma.membership.findFirst({
        where: {
          id: membershipId,
          organizationId,
        },
        include: {
          user: true,
        },
      });

      if (!targetMembership) {
        return res.status(404).json({
          success: false,
          error: 'Membership not found',
        });
      }

      if (targetMembership.userId === requestingUserId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cannot change your own role',
        });
      }

      if (targetMembership.role === Role.OWNER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cannot change the role of an OWNER',
        });
      }

      if (requestingUserMembership.role === Role.ADMIN) {
        if (targetMembership.role !== Role.MEMBER) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: ADMIN can only modify MEMBER roles',
          });
        }
        if (newRole === Role.ADMIN) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: ADMIN cannot promote to ADMIN',
          });
        }
      }

      const updatedMembership = await prisma.membership.update({
        where: { id: membershipId },
        data: { role: newRole },
        include: { user: true },
      });

      const { user } = updatedMembership;
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Unknown User';

      const responseData = {
        membershipId: updatedMembership.id,
        role: updatedMembership.role,
        createdAt: updatedMembership.createdAt,
        updatedAt: updatedMembership.updatedAt,
        user: {
          id: user.id,
          name,
          email: user.email,
          createdAt: user.createdAt,
        },
      };

      return res.status(200).json({
        success: true,
        message: 'Member role updated successfully',
        data: responseData,
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred',
      });
    }
  })();
});

const removeMemberParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  membershipId: z.string().uuid('Invalid membership ID'),
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationRouter.delete('/:organizationId/members/:membershipId', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const paramsResult = removeMemberParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, membershipId } = paramsResult.data;
      const requestingUserId = req.user.id;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
      }

      if (requestingUserMembership.role === Role.MEMBER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions',
        });
      }

      const targetMembership = await prisma.membership.findFirst({
        where: {
          id: membershipId,
          organizationId,
        },
        include: {
          user: true,
        },
      });

      if (!targetMembership) {
        return res.status(404).json({
          success: false,
          error: 'Membership not found',
        });
      }

      if (targetMembership.userId === requestingUserId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cannot remove yourself',
        });
      }

      if (targetMembership.role === Role.OWNER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cannot remove an OWNER',
        });
      }

      if (requestingUserMembership.role === Role.ADMIN) {
        if (targetMembership.role !== Role.MEMBER) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: ADMIN can only remove MEMBER roles',
          });
        }
      }

      const deletedMembership = await prisma.membership.delete({
        where: { id: membershipId },
        include: { user: true },
      });

      const { user } = deletedMembership;
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Unknown User';

      const responseData = {
        membershipId: deletedMembership.id,
        role: deletedMembership.role,
        user: {
          id: user.id,
          name,
          email: user.email,
          createdAt: user.createdAt,
        },
      };

      return res.status(200).json({
        success: true,
        message: 'Member removed successfully',
        removedMember: responseData,
      });
    } catch (error) {
      console.error('Error removing member:', error);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred',
      });
    }
  })();
});
