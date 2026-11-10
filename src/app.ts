import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';

import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { requestLogger } from './middlewares/request-logger.js';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
  app.use(
    express.urlencoded({ extended: false, limit: env.REQUEST_BODY_LIMIT }),
  );
  app.use(cookieParser());

  app.get('/api/v1/health', (_request: Request, response: Response) => {
    response.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: { status: 'ok' },
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
