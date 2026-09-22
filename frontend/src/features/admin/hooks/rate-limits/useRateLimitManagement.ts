import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  rateLimitQueries,
  useUpdateGeminiRateLimit,
} from '@/features/admin/api/rateLimitApi';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

export function useRateLimitManagement() {
  const { data: config, isLoading, isFetching, refetch } = useQuery({
    ...rateLimitQueries.gemini(),
  });

  const { mutateAsync: updateRateLimit, isPending: isSaving } =
    useUpdateGeminiRateLimit();

  const [guestLimit, setGuestLimit] = useState(2);
  const [userLimit, setUserLimit] = useState(10);
  const [prevConfig, setPrevConfig] = useState(config);

  if (config !== prevConfig) {
    setPrevConfig(config);
    if (config) {
      setGuestLimit(config.guestLimit);
      setUserLimit(config.userLimit);
    }
  }

  const handleSave = async () => {
    try {
      await updateRateLimit({ guestLimit, userLimit });
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
