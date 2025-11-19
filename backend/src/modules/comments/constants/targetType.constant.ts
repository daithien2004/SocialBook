export const TARGET_TYPES = [
  'post',
  'chapter',
  'comment',
  'paragraph',
] as const;
export type CommentTargetType = (typeof TARGET_TYPES)[number];
