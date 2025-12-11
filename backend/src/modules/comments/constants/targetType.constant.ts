export const TARGET_TYPES = [
  'post',
  'chapter',
  'paragraph',
  'comment',
] as const;
export type CommentTargetType = (typeof TARGET_TYPES)[number];
