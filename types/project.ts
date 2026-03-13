// ─── Project ────────────────────────────────────────────────

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Create ─────────────────────────────────────────────────

export interface CreateProjectDto {
  name: string;
  description?: string;
}

// ─── Update ─────────────────────────────────────────────────

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

// ─── Get All ────────────────────────────────────────────────

export type GetAllProjectsResponse = Project[];
