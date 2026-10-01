import { z } from 'zod';

// Shared pagination/query params used by all list endpoints
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export function applyPagination(params: PaginationParams): { limit: number; offset: number } {
  return {
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  };
}

// Slug generator
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Ensure slug uniqueness by appending a suffix if needed
export function uniqueSlug(base: string, suffix?: string | number): string {
  const slug = slugify(base);
  return suffix !== undefined ? `${slug}-${suffix}` : slug;
}

// Async wrapper to avoid try/catch in every route
export function asyncHandler<T>(
  fn: (...args: T[]) => Promise<void>,
): (...args: T[]) => void {
  return (...args: T[]) => {
    Promise.resolve(fn(...args)).catch(args[2] as (err: unknown) => void);
  };
}
