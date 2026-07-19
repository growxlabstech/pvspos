import { z } from 'zod';
import { checkoutSchema } from '../schemas/billing.schema';

export type CheckoutPayload = z.infer<typeof checkoutSchema>;

export interface CheckoutResult {
  success: boolean;
  saleId?: string;
  invoiceNumber?: string;
  error?: string;
}
