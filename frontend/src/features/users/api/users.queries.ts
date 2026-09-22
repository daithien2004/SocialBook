import {
  SearchUsersParams,
  SearchUsersResponse,
  UserListResponse,
  UserOverviewResponse,
  ReadingPreferences,
} from '@/features/users/schemas/user.schema';
import { getUsersAdmin, getUserOverview, getReadingPreferences, searchUsers } from './users.api';
import { userKeys } from '@/lib/query-keys';
import { GC_TIME, STALE_TIME } from '@/lib/query-constants';

export const userQueries = {
  adminList(query: string) {
    return {
      queryKey: userKeys.adminList(query),
      queryFn: (): Promise<UserListResponse> => getUsersAdmin(query),
    };
  },
  overview(userId: string) {
    return {
      queryKey: userKeys.overview(userId),
      queryFn: (): Promise<UserOverviewResponse> => getUserOverview(userId),
      staleTime: STALE_TIME.SEMI_STATIC,
      gcTime: GC_TIME.SEMI_STATIC,
    };
  },
  readingPreferences() {
    return {
      queryKey: userKeys.readingPreferences(),
      queryFn: (): Promise<ReadingPreferences> => getReadingPreferences(),
    };
  },
  search(params: SearchUsersParams) {
    return {
      queryKey: userKeys.search(params),
      queryFn: (): Promise<SearchUsersResponse> => searchUsers(params),
    };
  },
};