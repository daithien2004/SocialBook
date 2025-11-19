export const TARGET_TYPES = ['post', 'book', 'chapter', 'comment'] as const;
export type CommentTargetType = (typeof TARGET_TYPES)[number];