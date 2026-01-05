// Shared interfaces and types

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface FileUploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key: string;
}

export interface JobOptions {
  attempts?: number;
  backoff?: number;
  delay?: number;
  priority?: number;
}
