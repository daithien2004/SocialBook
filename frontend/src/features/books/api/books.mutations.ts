import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookKeys } from '@/lib/query-keys';
import {
  createBook,
  deleteBook,
  recordBookView,
  recordSearchKeyword,
  toggleLikeBook,
  updateBook,
} from './books.api';

export const useCreateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.adminLists() });
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBook,
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: bookKeys.byId(variables.bookId),
      });
      if (result?.slug) {
        queryClient.invalidateQueries({
          queryKey: bookKeys.detail(result.slug),
        });
      }
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.adminLists() });
    },
  });
};

export const useDeleteBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.adminLists() });
    },
  });
};

export const useLikeBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleLikeBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
};

export const useRecordView = () =>
  useMutation({
    mutationFn: recordBookView,
  });

export const useRecordSearchKeyword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordSearchKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bookKeys.trendingSearches(),
      });
    },
  });
};
