
export interface Contact {
  id: string;
  projectId: string;
  name: string;
  email: string;
  language: string;
  tags: string[] | null;
  discordUsername: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}


export interface CreateContactDto {
  projectId: string;
  name: string;
  email: string;
  language?: string;
  tags?: string[];
  discordUsername?: string;
  metadata?: Record<string, unknown>;
}


export interface UpdateContactDto {
  name?: string;
  email?: string;
  language?: string;
  tags?: string[] | null;
  discordUsername?: string | null;
  metadata?: Record<string, unknown> | null;
}


export type GetAllContactsResponse = Contact[];
