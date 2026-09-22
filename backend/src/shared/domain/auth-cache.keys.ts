export const AUTH_USER_CACHE_TTL_SECONDS = 60;

export function getAuthUserCacheKey(userId: string): string {
  return `auth:user:${userId}`;
}
