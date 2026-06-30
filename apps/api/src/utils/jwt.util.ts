import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateAccessToken = (payload: Record<string, unknown>): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
};
