import { z } from 'zod';

export const likeRequestSchema = z.object({
  targetId: z.string(),
  targetType: z.string(),
});
export type LikeRequest = z.infer<typeof likeRequestSchema>;

export const toggleLikeResultSchema = z.object({
  isLiked: z.boolean(),
});
export type ToggleLikeResult = z.infer<typeof toggleLikeResultSchema>;

export const likeCountSchema = z.object({
  count: z.number(),
});
export type LikeCountResponse = z.infer<typeof likeCountSchema>;

export const likeStatusSchema = z.object({
  isLiked: z.boolean(),
});
export type LikeStatusResponse = z.infer<typeof likeStatusSchema>;