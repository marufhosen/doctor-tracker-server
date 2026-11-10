import { z } from 'zod';

export const dashboardTrendsQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .strict()
  .refine(({ from, to }) => !from || !to || from <= to, {
    message: 'from must be before or equal to to',
    path: ['from'],
  });

export const dashboardTrendsRequestSchema = {
  query: dashboardTrendsQuerySchema,
};

export type DashboardTrendsQuery = z.infer<typeof dashboardTrendsQuerySchema>;
