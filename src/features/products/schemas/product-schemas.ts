import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(120, "Product name is too long"),
  sku: z.string().max(64, "SKU is too long").optional().or(z.literal("")),
  barcode: z
    .string()
    .max(64, "Barcode is too long")
    .optional()
    .or(z.literal("")),
  category_id: z.string().uuid().nullable().optional(),
  supplier_id: z.string().uuid().nullable().optional(),
  cost_price: z.coerce
    .number({ invalid_type_error: "Cost price must be a number" })
    .min(0, "Cost price cannot be negative"),
  selling_price: z.coerce
    .number({ invalid_type_error: "Selling price must be a number" })
    .min(0, "Selling price cannot be negative"),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit is required").max(20, "Unit is too long"),
  description: z
    .string()
    .max(1000, "Description is too long")
    .optional()
    .or(z.literal("")),
  min_stock_level: z.coerce
    .number({ invalid_type_error: "Min stock level must be a number" })
    .min(0, "Min stock level cannot be negative"),
  image_path: z.string().nullable().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
