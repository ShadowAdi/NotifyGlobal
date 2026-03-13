// ─── Send Log Status ────────────────────────────────────────

export type SendLogStatus = "pending" | "sent" | "failed" | "bounced";

export type SendLogChannel = "email" | "discord" | "slack";

// ─── SendLog ────────────────────────────────────────────────

export interface SendLog {
  id: string;
  projectId: string;
  contactId: string;
  eventId: string | null;
  campaignId: string | null;
  channel: SendLogChannel;
  status: SendLogStatus;
  translatedLanguage: string | null;
  subject: string | null;
  body: string | null;
  errorMessage: string | null;
  externalId: string | null;
  sentAt: Date | null;
  createdAt: Date;
}

// ─── Create ─────────────────────────────────────────────────

export interface CreateSendLogDto {
  projectId: string;
  contactId: string;
  eventId?: string;
  campaignId?: string;
  channel?: SendLogChannel;
  status?: SendLogStatus;
  translatedLanguage?: string;
  subject?: string;
  body?: string;
  errorMessage?: string;
  externalId?: string;
  sentAt?: Date;
}

// ─── Update ─────────────────────────────────────────────────

export interface UpdateSendLogDto {
  status?: SendLogStatus;
  translatedLanguage?: string;
  subject?: string;
  body?: string;
  errorMessage?: string | null;
  externalId?: string;
  sentAt?: Date;
}

// ─── Get All ────────────────────────────────────────────────

export type GetAllSendLogsResponse = SendLog[];
