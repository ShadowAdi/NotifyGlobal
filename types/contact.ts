// ─── Contact ────────────────────────────────────────────────

export interface Contact {
  id: string;
  projectId: string;
  name: string;
  email: string;
  language: string;
  discordUsername: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Create ─────────────────────────────────────────────────

export interface CreateContactDto {
  projectId: string;
  name: string;
  email: string;
  language?: string;
  discordUsername?: string;
  metadata?: Record<string, unknown>;
}

// ─── Update ─────────────────────────────────────────────────

export interface UpdateContactDto {
  name?: string;
  email?: string;
  language?: string;
  discordUsername?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ─── Get All ────────────────────────────────────────────────

export type GetAllContactsResponse = Contact[];
