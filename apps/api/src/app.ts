import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { API_PREFIX, SECURITY_HEADERS } from './constants/app.constants.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { logger } from './logging/logger.js';
import { healthRouter } from './routes/health.route.js';
import { authRouter } from './routes/auth.route.js';
import { organizationRouter } from './routes/organization.route.js';
import { projectRouter } from './routes/project.route.js';
import { supplierRouter } from './routes/supplier.route.js';
import { projectIntegrationRouter } from './routes/project-integration.route.js';
import { projectSupplierRouter } from './routes/project-supplier.route.js';
import { projectQuotaRouter } from './routes/project-quota.route.js';
import { dashboardRouter } from './routes/dashboard.route.js';
import { trackingRouter } from './routes/tracking.route.js';
import { respondentSessionRouter } from './routes/respondent-session.route.js';
import { callbackRouter } from './routes/callback.route.js';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use((_req, res, next) => {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      res.setHeader(header, value);
    }
    next();
  });
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    (pinoHttp as any)({
      logger,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      customProps: (req: any) => ({ requestId: req.id }),
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/health', healthRouter);
  app.use(`${API_PREFIX}/health`, healthRouter);
  app.use(`${API_PREFIX}/auth`, authRouter);
  app.use(`${API_PREFIX}/organizations`, organizationRouter);
  app.use(`${API_PREFIX}/organizations/:organizationId/projects`, projectRouter);
  app.use(`${API_PREFIX}/organizations/:organizationId/suppliers`, supplierRouter);
  app.use(
    `${API_PREFIX}/organizations/:organizationId/projects/:projectId/integration`,
    projectIntegrationRouter,
  );
  app.use(
    `${API_PREFIX}/organizations/:organizationId/projects/:projectId/suppliers`,
    projectSupplierRouter,
  );
  app.use(
    `${API_PREFIX}/organizations/:organizationId/projects/:projectId/quotas`,
    projectQuotaRouter,
  );
  app.use(`${API_PREFIX}/organizations/:organizationId/dashboard`, dashboardRouter);
  app.use(
    `${API_PREFIX}/organizations/:organizationId/respondent-sessions`,
    respondentSessionRouter,
  );

  app.use('/track', trackingRouter);
  app.use('/callbacks', callbackRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
