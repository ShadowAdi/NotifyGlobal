import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be under 100 characters"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(500, "Subject must be under 500 characters"),
  body: z
    .string()
    .min(1, "Body content is required")
    .max(50000, "Body must be under 50,000 characters"),
});

export const updateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be under 100 characters"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(500, "Subject must be under 500 characters"),
  body: z
    .string()
    .min(1, "Body content is required")
    .max(50000, "Body must be under 50,000 characters"),
});

export type CreateTemplateFormValues = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateFormValues = z.infer<typeof updateTemplateSchema>;
