import { useState } from 'react';
import {
  useGetGeminiRateLimitQuery,
  useUpdateGeminiRateLimitMutation,
} from '../../api/rateLimitApi';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

export function useRateLimitManagement() {
  const { data: config, isLoading, isFetching, refetch } = useGetGeminiRateLimitQuery();

  const [updateRateLimit, { isLoading: isSaving }] = useUpdateGeminiRateLimitMutation();

  // Local overrides — undefined means "not yet edited by the user"
  const [guestLimitOverride, setGuestLimit] = useState<number | undefined>(undefined);
  const [userLimitOverride, setUserLimit] = useState<number | undefined>(undefined);

  // Displayed values: prefer local override, fall back to server data, then default
  const guestLimit = guestLimitOverride ?? config?.guestLimit ?? 2;
  const userLimit = userLimitOverride ?? config?.userLimit ?? 10;

  const handleSave = async () => {
    try {
      await updateRateLimit({ guestLimit, userLimit }).unwrap();
      // Clear overrides so displayed values re-derive from fresh server data
      setGuestLimit(undefined);
      setUserLimit(undefined);
      toast.success('Cập nhật rate limit thành công');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  const hasChanges =
    !!config &&
    (guestLimit !== config.guestLimit || userLimit !== config.userLimit);

  return {
    config,
    isLoading: isLoading || isFetching,
    guestLimit,
    userLimit,
    setGuestLimit,
    setUserLimit,
    handleSave,
    isSaving,
    hasChanges,
    refetch,
  };
}
