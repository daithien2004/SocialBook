import { rateLimitKeys } from '@/lib/query-keys';
import { getGeminiRateLimit } from './rate-limit.api';
import type { RateLimitConfig } from './rate-limit.api';

export const rateLimitQueries = {
  gemini: () => ({
    queryKey: rateLimitKeys.gemini(),
    queryFn: (): Promise<RateLimitConfig> => getGeminiRateLimit(),
  }),
};