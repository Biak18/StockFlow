import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(80, "Category name is too long"),
  description: z
    .string()
    .max(300, "Description is too long")
    .optional()
    .or(z.literal("")),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
