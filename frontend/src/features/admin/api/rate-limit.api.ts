import { apiRequest } from '@/lib/nestjs-client-api';

export interface RateLimitConfig {
  guestLimit: number;
  userLimit: number;
  ttl: number;
  blockDuration: number;
}

export interface UpdateRateLimitPayload {
  guestLimit?: number;
  userLimit?: number;
  ttl?: number;
  blockDuration?: number;
}

export async function getGeminiRateLimit(): Promise<RateLimitConfig> {
  return apiRequest<RateLimitConfig>({
    url: '/admin/rate-limits/gemini',
    method: 'GET',
  });
}

export async function updateGeminiRateLimit(
  payload: UpdateRateLimitPayload,
): Promise<RateLimitConfig> {
  return apiRequest<RateLimitConfig>({
    url: '/admin/rate-limits/gemini',
    method: 'PUT',
    data: payload,
  });
}