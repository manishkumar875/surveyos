import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { logger } from '../logging/logger.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = req.id;

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.flatten(),
        requestId,
      },
    });
    return;
  }

  if (error instanceof AppError) {
    logger.warn({ error, requestId }, 'Operational API error');
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
      },
    });
    return;
  }

  logger.error({ error, requestId }, 'Unhandled API error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'Internal server error' : String(error),
      requestId,
    },
  });
};
