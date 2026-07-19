import { z } from 'zod';

export const updateSettingsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  storeAddress: z.string().optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
});

export type UpdateSettingsSchemaInput = z.infer<typeof updateSettingsSchema>;
