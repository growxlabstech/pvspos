import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Price must be positive'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative'),
  taxRate: z.coerce.number().min(0).max(100),
  unit: z.enum(['PIECE', 'KG', 'GRAM', 'LITER', 'ML', 'DOZEN', 'BOX', 'PACK']),
  imageUrl: z.string().optional().nullable().or(z.literal('')),
  lowStockThreshold: z.coerce.number().min(0),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
