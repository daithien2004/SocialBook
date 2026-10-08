import { apiRequest } from '@/lib/api-client';
import {
  commentsTargetResponseSchema,
  type CreateCommentRequest,
  type CreatedComment,
  type DeleteCommentRequest,
  type EditCommentRequest,
  type GetCommentsRequest,
  type GetCommentsResponse,
} from '@/features/comments/schemas/comment.schema';

export async function getCommentsByTarget(
  request: GetCommentsRequest,
): Promise<GetCommentsResponse> {
  const response = await apiRequest<unknown>({
    url: '/comments/target',
    method: 'GET',
    params: {
      targetId: request.targetId,
      parentId: request.parentId,
      page: request.page,
      limit: request.limit,
    },
  });

  const parsed = commentsTargetResponseSchema.parse(response);
  return {
    comments: parsed.data,
    nextCursor:
      parsed.meta.page < parsed.meta.totalPages
        ? String(parsed.meta.page + 1)
        : null,
    hasMore: parsed.meta.page < parsed.meta.totalPages,
  };
}

export async function createComment(
  request: CreateCommentRequest,
): Promise<CreatedComment> {
  return apiRequest<CreatedComment>({
    url: '/comments',
    method: 'POST',
    data: request,
  });
}

export async function updateComment(
  request: EditCommentRequest,
): Promise<CreatedComment> {
  return apiRequest<CreatedComment>({
    url: `/comments/${request.id}`,
    method: 'PUT',
    data: { content: request.content },
  });
}

export async function deleteComment(
  request: DeleteCommentRequest,
): Promise<void> {
  await apiRequest<void>({
    url: `/comments/${request.id}`,
    method: 'DELETE',
  });
}

export async function getCommentCount(request: {
  targetId: string;
  targetType: string;
  parentId?: string | null;
}): Promise<number> {
  const response = await apiRequest<{ count: number }>({
    url: '/comments/count',
    method: 'GET',
    params: request,
  });
  return response.count;
}
