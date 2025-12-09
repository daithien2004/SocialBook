export const TARGET_TYPES = [
  'post',
  'chapter',
  'paragraph',
] as const;
export type CommentTargetType = (typeof TARGET_TYPES)[number];
