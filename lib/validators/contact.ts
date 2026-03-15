import { z } from "zod";

// Common language codes
export const commonLanguages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
] as const;

export const createContactSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters"),
  email: z.string().email("Invalid email address"),
  language: z
    .string()
    .regex(/^[a-z]{2}$/, "Language must be a 2-letter ISO code (e.g., en, es, fr)"),
  tags: z.string().optional(),
});

export const updateContactSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters"),
  email: z.string().email("Invalid email address"),
  language: z
    .string()
    .regex(/^[a-z]{2}$/, "Language must be a 2-letter ISO code (e.g., en, es, fr)"),
  tags: z.string().optional(),
});

export type CreateContactFormValues = z.infer<typeof createContactSchema>;
export type UpdateContactFormValues = z.infer<typeof updateContactSchema>;
