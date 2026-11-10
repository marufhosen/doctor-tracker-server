import { z } from 'zod';

const phonePattern = /^\+?[0-9][0-9 ()-]{6,19}$/;
const objectIdPattern = /^[a-f\d]{24}$/i;

const optionalTrimmedString = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength).optional();

export const createDoctorBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    specialization: z.string().trim().min(1).max(120),
    hospital: z.string().trim().min(1).max(160),
    phone: z.string().trim().regex(phonePattern).max(21),
    email: z.string().trim().toLowerCase().email().max(254),
  })
  .strict();

export const doctorIdParamsSchema = z.object({
  id: z.string().regex(objectIdPattern, 'Invalid doctor ID'),
});

export const doctorListQuerySchema = z
  .object({
    search: optionalTrimmedString(100),
    specialization: optionalTrimmedString(120),
    hospital: optionalTrimmedString(160),
    createdFrom: z.coerce.date().optional(),
    createdTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z
      .enum(['name', 'specialization', 'hospital', 'createdAt'])
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()
  .refine(
    ({ createdFrom, createdTo }) =>
      !createdFrom || !createdTo || createdFrom <= createdTo,
    {
      message: 'createdFrom must be before or equal to createdTo',
      path: ['createdFrom'],
    },
  );

export const createDoctorRequestSchema = { body: createDoctorBodySchema };
export const doctorListRequestSchema = { query: doctorListQuerySchema };
export const doctorDetailsRequestSchema = { params: doctorIdParamsSchema };

export type CreateDoctorInput = z.infer<typeof createDoctorBodySchema>;
export type DoctorListQuery = z.infer<typeof doctorListQuerySchema>;
export type DoctorIdParams = z.infer<typeof doctorIdParamsSchema>;
