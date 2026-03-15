// ─── Event ──────────────────────────────────────────────────

export interface Event {
  id: string;
  projectId: string;
  eventName: string;
  eventId: string;
  templateId: string | null;
  subject: string | null;
  message: string | null;
  channel: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Create ─────────────────────────────────────────────────

export interface CreateEventDto {
  projectId: string;
  eventName: string;
  eventId: string;
  templateId?: string;
  subject?: string;
  message?: string;
  channel?: string;
  description?: string;
  isActive?: boolean;
}

// ─── Update ─────────────────────────────────────────────────

export interface UpdateEventDto {
  eventName?: string;
  templateId?: string | null;
  subject?: string | null;
  message?: string | null;
  channel?: string;
  description?: string | null;
  isActive?: boolean;
}

// ─── Get All ────────────────────────────────────────────────

export type GetAllEventsResponse = Event[];

// ─── Trigger (request body from external APIs) ──────────────

export interface TriggerEventBody {
  eventId: string;
  email: string;
  name?: string;
  language?: string;
  subject?: string;
  message?: string;
  variables?: Record<string, string>;
}
