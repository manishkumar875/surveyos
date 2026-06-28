import { createServer } from 'node:http';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './logging/logger.js';

const app = createApp();
const server = createServer(app);

server.listen(env.API_PORT, env.API_HOST, () => {
  logger.info(
    {
      host: env.API_HOST,
      port: env.API_PORT,
      environment: env.NODE_ENV,
    },
    'SurveyOS API server started',
  );
});

const shutdown = (signal: NodeJS.Signals): void => {
  logger.info({ signal }, 'Graceful shutdown started');

  server.close((error) => {
    if (error) {
      logger.error({ error }, 'Error while shutting down API server');
      process.exit(1);
    }

    logger.info('SurveyOS API server stopped');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
