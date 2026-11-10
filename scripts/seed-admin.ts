import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import { bootstrapAdmin } from '../src/modules/users/admin-bootstrap.js';

const seedAdmin = async (): Promise<void> => {
  try {
    await connectDatabase();
    const result = await bootstrapAdmin();

    logger.info(
      { email: result.email, created: result.created },
      result.created
        ? 'Administrator account created'
        : 'Administrator account already exists',
    );
  } catch (error) {
    logger.fatal({ err: error }, 'Administrator bootstrap failed');
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

void seedAdmin();
