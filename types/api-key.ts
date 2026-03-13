
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


export interface CreateApiKeyDto {
  projectId: string;
  name: string;
  expiresAt?: Date;
}


export interface UpdateApiKeyDto {
  name?: string;
  isActive?: boolean;
  expiresAt?: Date | null;
}


export type GetAllApiKeysResponse = ApiKey[];
