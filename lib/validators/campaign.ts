import { z } from "zod";

export const createCampaignSchema = z.object({
  name: z
    .string()
    .min(1, "Campaign name is required")
    .max(100, "Campaign name must be less than 100 characters"),
  channel: z.enum(["email", "sms", "discord", "slack"]),
  templateId: z.string().optional(),
  subject: z.string().max(200, "Subject must be less than 200 characters").optional(),
  message: z.string().max(50000, "Message must be less than 50,000 characters").optional(),
  variables: z.record(z.string(), z.string()).optional(),
  filterType: z.enum(["manual", "all", "language", "tags"]),
  filterLanguage: z.string().optional(),
  filterTags: z.string().optional(), // Comma-separated string
  contactIds: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
});

export const updateCampaignSchema = z.object({
  name: z
    .string()
    .min(1, "Campaign name is required")
    .max(100, "Campaign name must be less than 100 characters")
    .optional(),
  channel: z.enum(["email", "sms", "discord", "slack"]).optional(),
  subject: z.string().max(200, "Subject must be less than 200 characters").optional(),
  message: z.string().max(50000, "Message must be less than 50,000 characters").optional(),
  variables: z.record(z.string(), z.string()).nullable().optional(),
  status: z.enum(["draft", "sending", "completed", "failed"]).optional(),
  scheduledAt: z.string().optional(),
});

export type CreateCampaignFormValues = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignFormValues = z.infer<typeof updateCampaignSchema>;
