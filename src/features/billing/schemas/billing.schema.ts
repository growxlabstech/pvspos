import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Cart is empty"),
  paymentMethod: z.enum(["CASH", "UPI"]),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
  amountTendered: z.number().optional(),
});
