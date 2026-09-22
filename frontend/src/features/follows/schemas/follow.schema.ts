import { z } from 'zod';
import { paginationMetaSchema } from '@/lib/pagination.schema';

export const followStateSchema = z.object({
  isOwner: z.boolean(),
  isFollowing: z.boolean(),
  followId: z.string().optional(),
  userId: z.string().optional(),
  targetId: z.string().optional(),
});
export type FollowStateResponse = z.infer<typeof followStateSchema>;

export const followingUserSchema = z.object({
  id: z.string(),
  userId: z.string(),
  targetId: z.string(),
  image: z.string().optional(),
  username: z.string(),
  postCount: z.number(),
  readingListCount: z.number(),
  followersCount: z.number(),
  isFollowedByCurrentUser: z.boolean().optional(),
});
export type FollowingUser = z.infer<typeof followingUserSchema>;

export const followingUserPageSchema = z.object({
  data: z.array(followingUserSchema),
  meta: paginationMetaSchema,
});
export type FollowingUserPage = z.infer<typeof followingUserPageSchema>;