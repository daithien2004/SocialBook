import { z } from 'zod';

// ---------------------------------------------------------------------------
// Notification job payload schemas
// ---------------------------------------------------------------------------

export const LikeToggledJobSchema = z.object({
  userId: z.string().min(1),
  targetId: z.string().min(1),
  targetType: z.string().min(1),
  isLiked: z.boolean(),
});

export const CommentCreatedJobSchema = z.object({
  commentId: z.string().min(1),
  userId: z.string().min(1),
  targetId: z.string().min(1),
  targetType: z.string().min(1),
  parentId: z.string().optional(),
});

export const UserFollowedJobSchema = z.object({
  userId: z.string().min(1),
  targetId: z.string().min(1),
});

export const PostModeratedJobSchema = z.object({
  userId: z.string().min(1),
  postId: z.string().min(1),
  reason: z.string(),
  action: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Post moderation payload schema
// ---------------------------------------------------------------------------

export const PostModerationPayloadSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Analytics payload schema
// ---------------------------------------------------------------------------

export const TrackEventPayloadSchema = z.object({
  userId: z.string().min(1),
  eventType: z.string().min(1),
  bookId: z.string().optional(),
  chapterId: z.string().optional(),
  durationSeconds: z.number().optional(),
  progressPercent: z.number().optional(),
  source: z.string().optional(),
  deviceType: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Chroma payload schemas
// ---------------------------------------------------------------------------

export const ChromaBookJobSchema = z.object({
  bookId: z.string().min(1),
});
