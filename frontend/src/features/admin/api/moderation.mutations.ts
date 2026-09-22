import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moderationKeys } from '@/lib/query-keys';
import {
  approvePost,
  bulkApprovePosts,
  bulkRejectPosts,
  rejectPost,
} from './moderation.api';

export function useApprovePost() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: approvePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    },
  });
}

export function useRejectPost() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: rejectPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    },
  });
}

export function useBulkApprovePosts() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string[]>({
    mutationFn: bulkApprovePosts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    },
  });
}

export function useBulkRejectPosts() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string[]>({
    mutationFn: bulkRejectPosts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    },
  });
}