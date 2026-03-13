// ─── ApiKey ─────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  userId: string;
  projectId: string;
  key: string;
  name: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

// ─── Create ─────────────────────────────────────────────────

export interface CreateApiKeyDto {
  projectId: string;
  name: string;
  expiresAt?: Date;
}

// ─── Update ─────────────────────────────────────────────────

export interface UpdateApiKeyDto {
  name?: string;
  isActive?: boolean;
  expiresAt?: Date | null;
}

// ─── Get All ────────────────────────────────────────────────

export type GetAllApiKeysResponse = ApiKey[];
