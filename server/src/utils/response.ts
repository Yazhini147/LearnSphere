// Response helpers to ensure consistent API response shapes

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function successResponse<T>(data: T): { data: T } {
  return { data };
}

export function listResponse<T>(
  data: T[],
  meta: PaginationMeta,
): { data: T[]; meta: PaginationMeta } {
  return { data, meta };
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
