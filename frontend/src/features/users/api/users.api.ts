import { NESTJS_USERS_ENDPOINTS } from '@/constants/server-endpoints';
import { apiRequest } from '@/lib/api-client';
import { buildFormData } from '@/lib/utils';
import {
  SearchUsersParams,
  SearchUsersResponse,
  searchUsersPageSchema,
  updateUserAvatarSchema,
  UpdateUserOverviewRequest,
  User,
  UserListResponse,
  userPageSchema,
  UserOverviewResponse,
  userOverviewSchema,
  userSchema,
  ReadingPreferences,
  readingPreferencesSchema,
  UpdateReadingPreferencesRequest,
} from '@/features/users/schemas/user.schema';

interface SearchUsersRawPage {
  data: {
    id: string;
    username: string;
    email: string;
    image?: string | null;
    bio?: string | null;
    createdAt: string;
  }[];
  meta: { current: number; pageSize: number; total: number; totalPages: number };
}

export async function getUsersAdmin(query: string, signal?: AbortSignal): Promise<UserListResponse> {
  const response = await apiRequest<UserListResponse>({
    url: `${NESTJS_USERS_ENDPOINTS.getUsersAdmin}?${query}`,
    method: 'GET',
    signal,
  });
  return userPageSchema.parse(response);
}

export async function banUser(id: string): Promise<User> {
  const response = await apiRequest<User>({
    url: NESTJS_USERS_ENDPOINTS.banUser(id),
    method: 'PATCH',
  });
  return userSchema.parse(response);
}

export async function updateUserOverview(
  body: UpdateUserOverviewRequest,
): Promise<User> {
  const response = await apiRequest<User>({
    url: '/users/me/overview',
    method: 'PATCH',
    data: body,
  });
  return userSchema.parse(response);
}

export async function updateUserAvatar(file: File) {
  const response = await apiRequest<{ url: string }>({
    url: '/users/me/avatar',
    method: 'PATCH',
    data: buildFormData({ file }),
  });
  return updateUserAvatarSchema.parse(response);
}

export async function getUserOverview(
  userId: string,
): Promise<UserOverviewResponse> {
  const response = await apiRequest<UserOverviewResponse>({
    url: `/users/${userId}/overview`,
    method: 'GET',
  });
  return userOverviewSchema.parse(response);
}

export async function getReadingPreferences(): Promise<ReadingPreferences> {
  const response = await apiRequest<ReadingPreferences>({
    url: '/users/me/reading-preferences',
    method: 'GET',
  });
  return readingPreferencesSchema.parse(response);
}

export async function updateReadingPreferences(
  body: UpdateReadingPreferencesRequest,
): Promise<ReadingPreferences> {
  const response = await apiRequest<ReadingPreferences>({
    url: '/users/me/reading-preferences',
    method: 'PUT',
    data: body,
  });
  return readingPreferencesSchema.parse(response);
}

export async function searchUsers(
  params: SearchUsersParams,
  signal?: AbortSignal,
): Promise<SearchUsersResponse> {
  const response = await apiRequest<SearchUsersRawPage>({
    url: '/users/search',
    method: 'GET',
    signal,
    params: {
      username: params.keyword,
      page: params.current,
      limit: params.pageSize,
    },
  });
  const raw = {
    data: response.data.map((user) => ({
      id: user.id,
      username: user.username,
      avatar: user.image ?? '',
      bio: user.bio ?? '',
      createdAt: user.createdAt,
    })),
    meta: response.meta,
  };
  return searchUsersPageSchema.parse(raw);
}