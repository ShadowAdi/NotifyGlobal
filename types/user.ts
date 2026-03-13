// ─── User ───────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Create ─────────────────────────────────────────────────

export interface CreateUserDto {
  email: string;
  name?: string;
  password: string;
}

// ─── Update ─────────────────────────────────────────────────

export interface UpdateUserDto {
  email?: string;
  name?: string;
}

// ─── Get All ────────────────────────────────────────────────

export type GetAllUsersResponse = User[];
