import { commentKeys } from '@/lib/query-keys';
import { getCommentCount, getCommentsByTarget } from './comment.api';
import type {
  CommentRequest,
  GetCommentsRequest,
  GetCommentsResponse,
} from '@/features/comments/schemas/comment.schema';

export const commentQueries = {
  byTarget(request: GetCommentsRequest) {
    return {
      queryKey: commentKeys.byTarget(request),
      queryFn: (): Promise<GetCommentsResponse> =>
        getCommentsByTarget(request),
    };
  },
  count(request: CommentRequest) {
    return {
      queryKey: commentKeys.count(request),
      queryFn: (): Promise<number> => getCommentCount(request),
    };
  },
};