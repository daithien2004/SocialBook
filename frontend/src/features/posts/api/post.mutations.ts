import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postKeys } from '@/lib/query-keys';
import {
  createPost,
  deletePost,
  deletePostImage,
  deletePostPermanently,
  updatePost,
} from './post.api';
import type {
  CreatePostPayload,
  DeletePostResult,
  UpdatePostPayload,
} from './post.api';
import type {
  Post,
  PostWithModerationResult,
} from '@/features/posts/schemas/post.schema';

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation<PostWithModerationResult, Error, CreatePostPayload>({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.byUserLists() });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation<PostWithModerationResult, Error, UpdatePostPayload>({
    mutationFn: updatePost,
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.byUserLists() });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation<DeletePostResult, Error, string>({
    mutationFn: deletePost,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.byUserLists() });
    },
  });
}

export function useDeletePostPermanent() {
  const queryClient = useQueryClient();
  return useMutation<DeletePostResult, Error, string>({
    mutationFn: deletePostPermanently,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.byUserLists() });
    },
  });
}

export function useDeletePostImage() {
  const queryClient = useQueryClient();
  return useMutation<Post, Error, { id: string; imageUrl: string }>({
    mutationFn: deletePostImage,
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.byUserLists() });
    },
  });
}