export const STALE_TIME = {
  STATIC: 60 * 60 * 1000,
  SEMI_STATIC: 5 * 60 * 1000,
  DEFAULT: 60 * 1000,
} as const;

export const GC_TIME = {
  STATIC: 12 * 60 * 60 * 1000,
  SEMI_STATIC: 30 * 60 * 1000,
  DEFAULT: 5 * 60 * 1000,
} as const;

export const MAX_RETRY_COUNT = 2;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRY_COUNT) return false;
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === undefined || status >= 500;
}