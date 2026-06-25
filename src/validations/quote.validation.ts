import { z } from 'zod';
import { QuoteStatus } from '../db/schema';

export const createQuoteSchema = z.object({
  customer: z
    .string({
      required_error: 'Customer name is required',
    })
    .min(1, 'Customer name cannot be empty'),
  project: z
    .string({
      required_error: 'Project name is required',
    })
    .min(1, 'Project name cannot be empty'),
  estimatedValue: z
    .number({
      required_error: 'Estimated value is required',
      invalid_type_error: 'Estimated value must be a number',
    })
    .min(0, 'Estimated value must be greater than or equal to 0'),
});

export const updateStatusSchema = z.object({
  status: z.enum([QuoteStatus.NEW, QuoteStatus.IN_REVIEW, QuoteStatus.NEEDS_INFO, QuoteStatus.COMPLETED], {
    errorMap: () => ({
      message: `Invalid status. Allowed values: ${Object.values(QuoteStatus).join(', ')}`,
    }),
  }),
});

export const getQuotesQuerySchema = z.object({
  customer: z.string().optional(),
  project: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1).default(1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().min(1).max(100).default(10)),
});

export type CreateQuoteDto = z.infer<typeof createQuoteSchema>;
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
export type GetQuotesQueryDto = z.infer<typeof getQuotesQuerySchema>;
