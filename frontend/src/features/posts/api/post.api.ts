import { apiRequest } from '@/lib/api-client';
import {
  paginatedPostsSchema,
  postDetailSchema,
  postWithModerationSchema,
  type DeleteImageRequest,
  type PaginatedPostsResponse,
  type PaginationParams,
  type PaginationParamsByUser,
  type Post,
  type PostWithModerationResult,
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



export async function getPostsFeed(params?: PaginationParams): Promise<PaginatedPostsResponse> {
  const data = await apiRequest<unknown>({
    url: '/posts',
    method: 'GET',
    params: { cursor: params?.cursor, limit: params?.limit ?? 10 },
  });
  return paginatedPostsSchema.parse(data);
}

export async function getPostById(args: { id: string; userId?: string }): Promise<Post> {
  const data = await apiRequest<unknown>({
    url: `/posts/${args.id}`,
    method: 'GET',
    params: args.userId ? { userId: args.userId } : undefined,
  });
  return postDetailSchema.parse(data);
}

export async function getPostsByUser(params: PaginationParamsByUser): Promise<PaginatedPostsResponse> {
  const data = await apiRequest<unknown>({
    url: '/posts/user',
    method: 'GET',
    params: {
      cursor: params.cursor,
      limit: params.limit ?? 10,
      userId: params.userId,
    },
  });
  return paginatedPostsSchema.parse(data);
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
  const response = await apiRequest<unknown>({
    url: '/posts',
    method: 'POST',
    data: buildPostFormData({
      bookId: payload.bookId,
      content: payload.content,
      images: payload.images ? Array.from(payload.images) : undefined,
    }),
  });
  
  // Xử lý cả 2 trường hợp: API trả về RawPost hoặc { data: RawPost, warning, message }
  const isWrapped = response !== null && typeof response === 'object' && 'data' in response;
  if (isWrapped) {
    return postWithModerationSchema.parse(response);
  }
  return {
    data: postDetailSchema.parse(response),
  };
}

export async function updatePost(payload: UpdatePostPayload): Promise<PostWithModerationResult> {
  const { id, data } = payload;
  const response = await apiRequest<unknown>({
    url: `/posts/${id}`,
    method: 'PATCH',
    data: buildPostFormData({
      bookId: data.bookId,
      content: data.content,
      images: data.images,
      imageUrls: data.imageUrls,
    }),
  });
  
  const isWrapped = response !== null && typeof response === 'object' && 'data' in response;
  if (isWrapped) {
    return postWithModerationSchema.parse(response);
  }
  return {
    data: postDetailSchema.parse(response),
  };
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
  const data = await apiRequest<unknown>({
    url: `/posts/${payload.id}/images`,
    method: 'DELETE',
    data: { imageUrl: payload.imageUrl } as DeleteImageRequest,
  });
  return postDetailSchema.parse(data);
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