import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { bookKeys } from '@/lib/query-keys';
import {
  createBook,
  deleteBook,
  recordBookView,
  recordSearchKeyword,
  toggleLikeBook,
  updateBook,
} from './books.api';

export const useCreateBook = () =>
  useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.adminLists() });
    },
  });

export const useUpdateBook = () =>
  useMutation({
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

export const useDeleteBook = () =>
  useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.adminLists() });
    },
  });

export const useLikeBook = () =>
  useMutation({
    mutationFn: toggleLikeBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });

export const useRecordView = () =>
  useMutation({
    mutationFn: recordBookView,
  });

export const useRecordSearchKeyword = () =>
  useMutation({
    mutationFn: recordSearchKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bookKeys.trendingSearches(),
      });
    },
  });