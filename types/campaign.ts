
export type CampaignStatus = "draft" | "sending" | "completed" | "failed";


export type CampaignChannel = "email" | "sms" | "discord" | "slack";

export interface Campaign {
  id: string;
  projectId: string;
  templateId: string | null;
  name: string;
  subject: string | null;
  message: string | null;
  channel: CampaignChannel;
  status: CampaignStatus;
  totalContacts: string | null;
  sentCount: string;
  failedCount: string;
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}


export interface CreateCampaignDto {
  projectId: string;
  templateId?: string; // Optional - if not provided, use message
  name: string;
  subject?: string; // Optional - required only if templateId not provided
  message?: string; // Optional - required if templateId not provided
  channel: CampaignChannel;
  contactIds: string[]; // List of contact IDs to send to
  scheduledAt?: Date;
}


export interface UpdateCampaignDto {
  name?: string;
  subject?: string;
  message?: string | null;
  channel?: CampaignChannel;
  status?: CampaignStatus;
  scheduledAt?: Date | null;
}


export type GetAllCampaignsResponse = Campaign[];
