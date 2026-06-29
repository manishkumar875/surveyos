import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@surveyos/db';

export const authRouter: Router = Router();

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

authRouter.post('/signup', (req, res) => {
  void (async () => {
    try {
      const parseResult = signUpSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parseResult.error.errors,
        });
      }

      const { email, password, firstName, lastName } = parseResult.data;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'A user with this email already exists',
        });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: newUser,
      });
    } catch (error) {
      console.error('Error during user registration:', error);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred',
      });
    }
  })();
});

interface SignInBody {
  email?: string;
  password?: string;
}

authRouter.post('/signin', (req, res) => {
  const { email, password } = req.body as SignInBody;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required.',
    });
  }

  return res.status(501).json({
    success: false,
    error: 'Sign-in flow is scaffolded. Implement credential validation and token exchange here.',
  });
});
