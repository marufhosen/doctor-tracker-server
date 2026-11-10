import mongoose from 'mongoose';

import { env } from './env.js';

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === mongoose.STATES.connected) {
    return;
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
    });
  } catch (error) {
    throw new Error('Failed to connect to MongoDB', { cause: error });
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === mongoose.STATES.disconnected) {
    return;
  }

  await mongoose.disconnect();
};
