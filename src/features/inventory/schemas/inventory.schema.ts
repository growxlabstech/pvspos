import { z } from "zod";

export const restockSchema = z.object({
  quantity: z.number().positive("Quantity must be positive"),
  notes: z.string().optional(),
});

export const adjustStockSchema = z.object({
  quantity: z.number(),
  reason: z.string().min(1, "Reason is required"),
});

export type RestockInput = z.infer<typeof restockSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
