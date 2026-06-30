import type { User, Membership } from '@surveyos/db';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: Omit<User, 'passwordHash'>;
      membership?: Membership;
    }
  }
}

export {};
