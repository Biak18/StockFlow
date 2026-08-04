import { z } from "zod";

export const supplierSchema = z.object({
  name: z
    .string()
    .min(1, "Supplier name is required")
    .max(120, "Supplier name is too long"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(30, "Phone is too long").optional().or(z.literal("")),
  address: z
    .string()
    .max(200, "Address is too long")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(500, "Notes are too long").optional().or(z.literal("")),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
