export const COMMENT_TARGET_TYPES = ['post', 'book', 'chapter'] as const;
export type CommentTargetType = (typeof COMMENT_TARGET_TYPES)[number];