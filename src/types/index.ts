export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  error: string;
  details?: Record<string, string[]>;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
};

export type DateRange = {
  from: Date;
  to: Date;
};
