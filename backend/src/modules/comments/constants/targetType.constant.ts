export const TARGET_TYPES = ['post', 'book', 'chapter'] as const;
export type CommentTargetType = (typeof TARGET_TYPES)[number];