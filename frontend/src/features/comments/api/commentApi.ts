export { commentQueries } from '@/features/comments/api/comment.queries';
export { useCreateComment, useUpdateComment, useDeleteComment, useToggleCommentLike } from '@/features/comments/api/comment.mutations';
export type { ToggleCommentLikeRequest } from '@/features/comments/api/comment.mutations';
export {
  getCommentsByTarget,
  createComment,
  updateComment,
  deleteComment,
  getCommentCount,
} from '@/features/comments/api/comment.api';
export type {
  CommentAuthor,
  CommentItem,
  CommentsTargetResponse,
  GetCommentsResponse,
  GetCommentsRequest,
  CommentRequest,
  CreateCommentRequest,
  CreatedComment,
  EditCommentRequest,
  DeleteCommentRequest,
} from '@/features/comments/schemas/comment.schema';