import { apiRequest } from '@/lib/nestjs-client-api';
import {
  normalizeCommentsTargetResponse,
  type CommentsTargetResponse,
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
  const response = await apiRequest<CommentsTargetResponse>({
    url: '/comments/target',
    method: 'GET',
    params: request,
  });
  return normalizeCommentsTargetResponse(response);
}

export async function createComment(request: CreateCommentRequest): Promise<CreatedComment> {
  return apiRequest<CreatedComment>({
    url: '/comments',
    method: 'POST',
    data: request,
  });
}

export async function updateComment(request: EditCommentRequest): Promise<CreatedComment> {
  return apiRequest<CreatedComment>({
    url: `/comments/${request.id}`,
    method: 'PUT',
    data: { content: request.content },
  });
}

export async function deleteComment(request: DeleteCommentRequest): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>({
    url: `/comments/${request.id}`,
    method: 'DELETE',
  });
}

export async function getCommentCount(request: {
  targetId: string;
  targetType: string;
  parentId?: string | null;
}): Promise<number> {
  return apiRequest<number>({
    url: '/comments/count',
    method: 'GET',
    params: request,
  });
}