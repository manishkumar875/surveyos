import type { User } from '@surveyos/db';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: Omit<User, 'passwordHash'>;
    }
  }
}

export {};
