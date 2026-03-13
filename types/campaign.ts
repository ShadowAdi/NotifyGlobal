// ─── Campaign Status ────────────────────────────────────────

export type CampaignStatus = "draft" | "sending" | "completed" | "failed";

// ─── Campaign ───────────────────────────────────────────────

export interface Campaign {
  id: string;
  projectId: string;
  eventId: string;
  name: string;
  status: CampaignStatus;
  totalContacts: string | null;
  sentCount: string;
  failedCount: string;
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

// ─── Create ─────────────────────────────────────────────────

export interface CreateCampaignDto {
  projectId: string;
  eventId: string;
  name: string;
  scheduledAt?: Date;
}

// ─── Update ─────────────────────────────────────────────────

export interface UpdateCampaignDto {
  name?: string;
  status?: CampaignStatus;
  scheduledAt?: Date | null;
}

// ─── Get All ────────────────────────────────────────────────

export type GetAllCampaignsResponse = Campaign[];
