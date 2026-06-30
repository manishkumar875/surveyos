import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@surveyos/db';
import { verifyAccessToken } from '../utils/jwt.util.js';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res
        .status(401)
        .json({ success: false, error: 'Unauthorized: Missing or invalid token format' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
      return;
    }

    const decoded = verifyAccessToken(token);

    if (typeof decoded === 'string' || !decoded.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid token payload' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId as string },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ success: false, error: 'Unauthorized: User account is inactive' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }
};
