import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rateLimitKeys } from '@/lib/query-keys';
import { updateGeminiRateLimit } from './rate-limit.api';
import type { RateLimitConfig, UpdateRateLimitPayload } from './rate-limit.api';

export function useUpdateGeminiRateLimit() {
  const queryClient = useQueryClient();
  return useMutation<RateLimitConfig, Error, UpdateRateLimitPayload>({
    mutationFn: updateGeminiRateLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rateLimitKeys.all });
    },
  });
}