
export type CampaignStatus = "draft" | "sending" | "completed" | "failed";


export type CampaignChannel = "email" | "sms" | "discord" | "slack";

export type CampaignFilterType = "manual" | "all" | "language" | "tags";

export interface Campaign {
  id: string;
  projectId: string;
  templateId: string | null;
  name: string;
  subject: string | null;
  message: string | null;
  channel: CampaignChannel;
  filterType: CampaignFilterType;
  filterLanguage: string | null;
  filterTags: string[] | null;
  contactIds: string[] | null;
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
  templateId?: string; // Optional - if not provided, use message
  name: string;
  subject?: string; // Optional - required only if templateId not provided
  message?: string; // Optional - required if templateId not provided
  channel: CampaignChannel;
  filterType: CampaignFilterType; // How to select contacts
  filterLanguage?: string; // Required if filterType is 'language'
  filterTags?: string[]; // Required if filterType is 'tags'
  contactIds?: string[]; // Required if filterType is 'manual'
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
