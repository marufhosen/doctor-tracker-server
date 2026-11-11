import type { Server } from 'node:http';

import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const closeHttpServer = async (server: Server): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

const registerShutdownHandlers = (server: Server): void => {
  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.info({ signal }, 'Shutdown signal received');

    try {
      await closeHttpServer(server);
      await disconnectDatabase();
    } catch (error) {
      logger.error({ err: error }, 'Graceful shutdown failed');
      process.exitCode = 1;
    }
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
};

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, 'Server listening');
    });

    registerShutdownHandlers(server);
  } catch (error) {
    logger.fatal({ err: error }, 'Server startup failed');
    process.exitCode = 1;
  }
};

if (process.env.VERCEL !== '1') {
  void startServer();
}

export default app;
