import type { PageResult } from '@/shared/domain/pagination.types';

/** Runs a repository-owned page query and count query concurrently. */
export async function findPaginated<T>(
  findItems: () => Promise<T[]>,
  countTotal: () => Promise<number>,
): Promise<PageResult<T>> {
  const [items, total] = await Promise.all([findItems(), countTotal()]);

  return { items, total };
}
