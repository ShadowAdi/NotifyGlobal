// ─── Event ──────────────────────────────────────────────────

export interface Event {
  id: string;
  projectId: string;
  eventName: string;
  eventId: string;
  templateId: string;
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
  templateId: string;
  description?: string;
  isActive?: boolean;
}

// ─── Update ─────────────────────────────────────────────────

export interface UpdateEventDto {
  eventName?: string;
  templateId?: string;
  description?: string | null;
  isActive?: boolean;
}

// ─── Get All ────────────────────────────────────────────────

export type GetAllEventsResponse = Event[];
