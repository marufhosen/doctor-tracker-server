import { z } from 'zod';

import { PATIENT_GENDERS } from './patient.types.js';

const objectIdPattern = /^[a-f\d]{24}$/i;
const phonePattern = /^\+?[0-9][0-9 ()-]{6,19}$/;

const patientFields = {
  name: z.string().trim().min(1).max(120),
  condition: z.string().trim().min(1).max(200),
  phone: z.string().trim().regex(phonePattern).max(21).optional(),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
  age: z.number().int().min(0).max(150).optional(),
  gender: z.enum(PATIENT_GENDERS).optional(),
  address: z.string().trim().min(1).max(500).optional(),
};

export const createPatientBodySchema = z.object(patientFields).strict();

export const updatePatientBodySchema = z
  .object(patientFields)
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field must be provided',
  });

export const patientIdParamsSchema = z.object({
  id: z.string().regex(objectIdPattern, 'Invalid patient ID'),
});

export const doctorPatientParamsSchema = z.object({
  doctorId: z.string().regex(objectIdPattern, 'Invalid doctor ID'),
});

export const doctorPatientDeleteParamsSchema = doctorPatientParamsSchema.extend(
  {
    patientId: z.string().regex(objectIdPattern, 'Invalid patient ID'),
  },
);

const patientListQueryFields = {
  search: z.string().trim().min(1).max(100).optional(),
  condition: z.string().trim().min(1).max(200).optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(['name', 'condition', 'age', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
};

const withValidDateRange = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.strict().refine(
    (input) => {
      const { createdFrom, createdTo } = input as {
        createdFrom?: Date;
        createdTo?: Date;
      };
      return !createdFrom || !createdTo || createdFrom <= createdTo;
    },
    {
      message: 'createdFrom must be before or equal to createdTo',
      path: ['createdFrom'],
    },
  );

export const patientListQuerySchema = withValidDateRange(
  z.object({
    ...patientListQueryFields,
    doctorId: z.string().regex(objectIdPattern, 'Invalid doctor ID').optional(),
  }),
);

const doctorPatientListQuerySchema = withValidDateRange(
  z.object(patientListQueryFields),
);

export const createPatientRequestSchema = {
  params: doctorPatientParamsSchema,
  body: createPatientBodySchema,
};
export const patientListRequestSchema = { query: patientListQuerySchema };
export const patientDetailsRequestSchema = { params: patientIdParamsSchema };
export const updatePatientRequestSchema = {
  params: patientIdParamsSchema,
  body: updatePatientBodySchema,
};
export const doctorPatientListRequestSchema = {
  params: doctorPatientParamsSchema,
  query: doctorPatientListQuerySchema,
};
export const doctorPatientDeleteRequestSchema = {
  params: doctorPatientDeleteParamsSchema,
};

export type CreatePatientInput = z.infer<typeof createPatientBodySchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientBodySchema>;
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;
export type PatientIdParams = z.infer<typeof patientIdParamsSchema>;
export type DoctorPatientParams = z.infer<typeof doctorPatientParamsSchema>;
export type DoctorPatientDeleteParams = z.infer<
  typeof doctorPatientDeleteParamsSchema
>;
