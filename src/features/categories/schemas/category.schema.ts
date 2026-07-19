import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
