// ─── Template ───────────────────────────────────────────────

export interface Template {
  id: string;
  projectId: string;
  name: string;
  subject: string;
  body: string;
  variables: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Create ─────────────────────────────────────────────────

export interface CreateTemplateDto {
  projectId: string;
  name: string;
  subject: string;
  body: string;
  variables?: string[];
}

// ─── Update ─────────────────────────────────────────────────

export interface UpdateTemplateDto {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
}

// ─── Get All ────────────────────────────────────────────────

export type GetAllTemplatesResponse = Template[];
