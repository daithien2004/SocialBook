import { keepPreviousData } from '@tanstack/react-query';
import { moderationKeys } from '@/lib/query-keys';
import { getFlaggedPosts, getModerationStats } from './moderation.api';
import type {
  FlaggedPostsResponse,
  GetFlaggedPostsParams,
  ModerationStats,
} from './moderation.api';

export const moderationQueries = {
  flaggedPosts: (params?: GetFlaggedPostsParams) => ({
    queryKey: moderationKeys.flaggedPosts({
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      reason: params?.reason,
      startDate: params?.startDate,
      endDate: params?.endDate,
      sortBy: params?.sortBy,
    }),
    queryFn: (): Promise<FlaggedPostsResponse> => getFlaggedPosts(params),
    placeholderData: keepPreviousData,
  }),
  stats: () => ({
    queryKey: moderationKeys.stats(),
    queryFn: (): Promise<ModerationStats> => getModerationStats(),
  }),
};