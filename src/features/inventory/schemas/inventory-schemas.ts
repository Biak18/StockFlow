import { z } from "zod";

export const stockMovementSchema = z.object({
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .positive("Quantity must be greater than 0"),
  notes: z.string().max(300, "Notes are too long").optional().or(z.literal("")),
});

export type StockMovementFormValues = z.infer<typeof stockMovementSchema>;
