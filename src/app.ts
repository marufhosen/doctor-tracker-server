import express, { type Express, type Request, type Response } from 'express';

export const createApp = (): Express => {
  const app = express();

  app.get('/api/v1/health', (_request: Request, response: Response) => {
    response.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: { status: 'ok' },
    });
  });

  return app;
};

export const app = createApp();
