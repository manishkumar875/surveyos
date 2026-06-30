import type { Request, Response, NextFunction } from 'express';
import { prisma, Role } from '@surveyos/db';

const RoleWeight: Record<Role, number> = {
  [Role.OWNER]: 3,
  [Role.ADMIN]: 2,
  [Role.MEMBER]: 1,
};

export const requireRole = (minimumRole: Role) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized: User not authenticated' });
        return;
      }

      const orgId = req.headers['x-organization-id'] as string;

      if (!orgId) {
        res
          .status(403)
          .json({ success: false, error: 'Forbidden: Missing X-Organization-Id header' });
        return;
      }

      const membership = await prisma.membership.findUnique({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: req.user.id,
          },
        },
      });

      if (!membership) {
        res
          .status(403)
          .json({ success: false, error: 'Forbidden: User is not a member of this organization' });
        return;
      }

      const userRoleWeight = RoleWeight[membership.role];
      const requiredRoleWeight = RoleWeight[minimumRole];

      if (userRoleWeight < requiredRoleWeight) {
        res.status(403).json({ success: false, error: 'Forbidden: Insufficient role permissions' });
        return;
      }

      req.membership = membership;
      next();
    } catch {
      res.status(500).json({ success: false, error: 'Internal Server Error during authorization' });
    }
  };
};
