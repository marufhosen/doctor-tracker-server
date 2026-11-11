import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import * as helmetModule from 'helmet';
import type { HelmetOptions } from 'helmet';

import { corsOptions } from './config/cors.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { csrfProtection } from './middlewares/csrf.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { noStore } from './middlewares/no-store.js';
import { apiLimiter } from './middlewares/rate-limiter.js';
import { requestLogger } from './middlewares/request-logger.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { doctorRouter } from './modules/doctors/doctor.routes.js';
import {
  doctorPatientRouter,
  patientRouter,
} from './modules/patients/patient.routes.js';

const helmet = ('default' in helmetModule
  ? helmetModule.default
  : helmetModule) as unknown as (
  options?: Readonly<HelmetOptions>,
) => RequestHandler;

const connectDatabaseForVercel = async (
  _request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
};

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(requestLogger);
  app.use(noStore);
  app.use(apiLimiter);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
  app.use(
    express.urlencoded({ extended: false, limit: env.REQUEST_BODY_LIMIT }),
  );
  app.use(cookieParser());
  app.use(csrfProtection);

  app.get('/api/v1/health', (_request: Request, response: Response) => {
    response.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: { status: 'ok' },
    });
  });

  if (process.env.VERCEL === '1') {
    app.use(connectDatabaseForVercel);
  }

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/doctors', doctorPatientRouter);
  app.use('/api/v1/doctors', doctorRouter);
  app.use('/api/v1/patients', patientRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
