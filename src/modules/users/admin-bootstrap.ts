import { env } from '../../config/env.js';
import { hashPassword } from '../auth/password.js';
import { UserModel } from './user.model.js';

interface AdminBootstrapDependencies {
  findByEmail: (email: string) => Promise<boolean>;
  hashPassword: (password: string) => Promise<string>;
  createAdmin: (input: {
    name: string;
    email: string;
    passwordHash: string;
  }) => Promise<void>;
}

const defaultDependencies: AdminBootstrapDependencies = {
  findByEmail: async (email) => {
    return (await UserModel.exists({ email })) !== null;
  },
  hashPassword,
  createAdmin: async (input) => {
    await UserModel.create({
      ...input,
      role: 'ADMIN',
      isActive: true,
    });
  },
};

export interface AdminBootstrapResult {
  created: boolean;
  email: string;
}

export const createAdminBootstrap = (
  dependencies: AdminBootstrapDependencies = defaultDependencies,
) => {
  return async (): Promise<AdminBootstrapResult> => {
    const email = env.ADMIN_EMAIL.trim().toLowerCase();

    if (await dependencies.findByEmail(email)) {
      return { created: false, email };
    }

    const passwordHash = await dependencies.hashPassword(env.ADMIN_PASSWORD);

    try {
      await dependencies.createAdmin({
        name: env.ADMIN_NAME.trim(),
        email,
        passwordHash,
      });
      return { created: true, email };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11_000
      ) {
        return { created: false, email };
      }

      throw error;
    }
  };
};

export const bootstrapAdmin = createAdminBootstrap();
