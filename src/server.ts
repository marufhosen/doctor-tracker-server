import type { Server } from 'node:http';

import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

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
    console.info(`${signal} received; shutting down`);

    try {
      await closeHttpServer(server);
      await disconnectDatabase();
    } catch (error) {
      console.error('Graceful shutdown failed', error);
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
      console.info(`Server listening on port ${env.PORT}`);
    });

    registerShutdownHandlers(server);
  } catch (error) {
    console.error('Server startup failed', error);
    process.exitCode = 1;
  }
};

void startServer();
