import { z } from 'zod';
import { paginationMetaSchema } from '@/lib/pagination.schema';

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  roleId: z.string(),
  isVerified: z.boolean(),
  isBanned: z.boolean(),
  provider: z.string(),
  image: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const userPageSchema = z.object({
  data: z.array(userSchema),
  meta: paginationMetaSchema,
});
export type UserPage = z.infer<typeof userPageSchema>;
export type UserListResponse = UserPage;

export const userOverviewSchema = z.object({
  id: z.string(),
  username: z.string(),
  image: z.string().nullable().optional(),
  createdAt: z.string(),
  postCount: z.number(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  readingListCount: z.number(),
  followersCount: z.number(),
});
export type UserOverviewResponse = z.infer<typeof userOverviewSchema>;

export const updateUserOverviewRequestSchema = z.object({
  username: z.string(),
  bio: z.string(),
  location: z.string(),
  website: z.string(),
});
export type UpdateUserOverviewRequest = z.infer<
  typeof updateUserOverviewRequestSchema
>;

export const updateUserAvatarSchema = z.object({
  url: z.string(),
});
export type UpdateUserAvatarResponse = z.infer<typeof updateUserAvatarSchema>;

export const searchUsersParamsSchema = z.object({
  keyword: z.string(),
  current: z.number().optional(),
  pageSize: z.number().optional(),
});
export type SearchUsersParams = z.infer<typeof searchUsersParamsSchema>;

export const searchUserItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  createdAt: z.string(),
});
export type SearchUserItem = z.infer<typeof searchUserItemSchema>;

export const searchUsersPageSchema = z.object({
  data: z.array(searchUserItemSchema),
  meta: paginationMetaSchema,
});
export type SearchUsersResponse = z.infer<typeof searchUsersPageSchema>;

const readingThemeSchema = z.enum(['light', 'dark', 'sepia', 'paper']);
const readingTextAlignSchema = z.enum(['left', 'center', 'justify']);

export const readingPreferencesSchema = z.object({
  theme: readingThemeSchema,
  fontSize: z.number(),
  fontFamily: z.string(),
  lineHeight: z.number(),
  letterSpacing: z.number(),
  backgroundColor: z.string(),
  textColor: z.string(),
  textAlign: readingTextAlignSchema,
  marginWidth: z.number(),
  warmth: z.number(),
  brightness: z.number(),
});
export type ReadingPreferences = z.infer<typeof readingPreferencesSchema>;

export const updateReadingPreferencesRequestSchema =
  readingPreferencesSchema.partial();
export type UpdateReadingPreferencesRequest = z.infer<
  typeof updateReadingPreferencesRequestSchema
>;