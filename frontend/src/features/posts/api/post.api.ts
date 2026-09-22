import { apiRequest } from '@/lib/nestjs-client-api';
import {
  normalizePaginatedPosts,
  normalizePost,
  normalizePostWithModeration,
  type DeleteImageRequest,
  type PaginatedPostsResponse,
  type PaginationParams,
  type PaginationParamsByUser,
  type Post,
  type PostWithModerationResult,
  type RawPost,
  type RawPaginatedPosts,
  type TopReader,
  type TrendingBook,
  type UpdatePostRequest,
} from '@/features/posts/schemas/post.schema';

export interface DeletePostResult {
  id: string;
  message?: string;
}

export interface CreatePostPayload {
  bookId: string;
  content: string;
  images?: FileList | File[] | null;
}

export interface UpdatePostPayload {
  id: string;
  data: UpdatePostRequest;
}

type MutationRawResponse = { data: RawPost; warning?: string; message?: string } | RawPost;

function isWrappedResponse(
  response: MutationRawResponse,
): response is { data: RawPost; warning?: string; message?: string } {
  return response !== null && typeof response === 'object' && 'data' in response;
}

function normalizeMutationResponse(response: MutationRawResponse): PostWithModerationResult {
  if (isWrappedResponse(response)) {
    return normalizePostWithModeration(response);
  }
  return {
    data: normalizePost(response),
    warning: undefined,
    message: undefined,
  };
}

export async function getPostsFeed(params?: PaginationParams): Promise<PaginatedPostsResponse> {
  const data = await apiRequest<RawPaginatedPosts>({
    url: '/posts',
    method: 'GET',
    params: { cursor: params?.cursor, limit: params?.limit ?? 10 },
  });
  return normalizePaginatedPosts(data);
}

export async function getPostById(args: { id: string; userId?: string }): Promise<Post> {
  const data = await apiRequest<RawPost>({
    url: `/posts/${args.id}`,
    method: 'GET',
    params: args.userId ? { userId: args.userId } : undefined,
  });
  return normalizePost(data);
}

export async function getPostsByUser(params: PaginationParamsByUser): Promise<PaginatedPostsResponse> {
  const data = await apiRequest<RawPaginatedPosts>({
    url: '/posts/user',
    method: 'GET',
    params: {
      cursor: params.cursor,
      limit: params.limit ?? 10,
      userId: params.userId,
    },
  });
  return normalizePaginatedPosts(data);
}

function buildPostFormData(payload: {
  bookId?: string;
  content?: string;
  images?: File[];
  imageUrls?: string[];
}): FormData {
  const formData = new FormData();
  if (payload.bookId) formData.append('bookId', payload.bookId);
  if (payload.content !== undefined) formData.append('content', payload.content);
  payload.images?.forEach((file) => formData.append('images', file));
  payload.imageUrls?.forEach((url) => formData.append('imageUrls', url));
  return formData;
}

export async function createPost(payload: CreatePostPayload): Promise<PostWithModerationResult> {
  const response = await apiRequest<MutationRawResponse>({
    url: '/posts',
    method: 'POST',
    data: buildPostFormData({
      bookId: payload.bookId,
      content: payload.content,
      images: payload.images ? Array.from(payload.images) : undefined,
    }),
  });
  return normalizeMutationResponse(response);
}

export async function updatePost(payload: UpdatePostPayload): Promise<PostWithModerationResult> {
  const { id, data } = payload;
  const response = await apiRequest<MutationRawResponse>({
    url: `/posts/${id}`,
    method: 'PATCH',
    data: buildPostFormData({
      bookId: data.bookId,
      content: data.content,
      images: data.images,
      imageUrls: data.imageUrls,
    }),
  });
  return normalizeMutationResponse(response);
}

export async function deletePost(id: string): Promise<DeletePostResult> {
  const data = await apiRequest<{ message?: string }>({
    url: `/posts/${id}`,
    method: 'DELETE',
  });
  return { id, message: data.message };
}

export async function deletePostPermanently(id: string): Promise<DeletePostResult> {
  const data = await apiRequest<{ message?: string }>({
    url: `/posts/${id}/permanent`,
    method: 'DELETE',
  });
  return { id, message: data.message };
}

export async function deletePostImage(payload: { id: string; imageUrl: string }): Promise<Post> {
  const data = await apiRequest<RawPost>({
    url: `/posts/${payload.id}/images`,
    method: 'DELETE',
    data: { imageUrl: payload.imageUrl } as DeleteImageRequest,
  });
  return normalizePost(data);
}

export async function getTrendingBooks(params?: { days?: number; limit?: number }): Promise<TrendingBook[]> {
  return apiRequest<TrendingBook[]>({
    url: '/analytics/trending-books',
    method: 'GET',
    params: params || {},
  });
}

export async function getTopActiveReaders(params?: { days?: number; limit?: number }): Promise<TopReader[]> {
  return apiRequest<TopReader[]>({
    url: '/analytics/top-readers',
    method: 'GET',
    params: params || {},
  });
}