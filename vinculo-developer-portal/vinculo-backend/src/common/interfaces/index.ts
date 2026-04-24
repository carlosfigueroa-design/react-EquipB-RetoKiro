/**
 * Interfaces compartidas del backend VÍNCULO
 */

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  cursor?: string;
  hasMore: boolean;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  version: string;
}
