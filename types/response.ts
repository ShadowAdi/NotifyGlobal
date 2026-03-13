// ─── Generic API Response Types ─────────────────────────────

export type ApiStatus = "ok" | "error";

export interface ApiResponse<T = undefined> {
  status: ApiStatus;
  message: string;
  data?: T;
}

export interface ApiSuccessResponse<T> {
  status: "ok";
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
}

// ─── Paginated Response ─────────────────────────────────────

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type PaginatedResponse<T> = ApiSuccessResponse<PaginatedData<T>>;

// ─── Toast helpers ──────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  variant: ToastVariant;
  title: string;
  description?: string;
}
