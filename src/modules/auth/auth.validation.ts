import { z } from 'zod';

export const loginBodySchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(256),
    rememberMe: z.boolean().default(false),
  })
  .strict();

export const loginRequestSchema = {
  body: loginBodySchema,
};

export type LoginInput = z.infer<typeof loginBodySchema>;
