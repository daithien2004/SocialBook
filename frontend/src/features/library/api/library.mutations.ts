import { useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryKeys, recommendationsKeys } from '@/lib/query-keys';
import {
  addBookToCollections,
  createCollection,
  deleteCollection,
  recordReadingTime,
  removeBookFromLibrary,
  updateCollection,
  updateLibraryStatus,
  updateReadingProgress,
  type UpdateReadingProgressResult,
} from './library.api';
import type {
  AddToCollectionsRequest,
  Collection,
  CreateCollectionRequest,
  LibraryItem,
  UpdateCollectionRequest,
  UpdateProgressRequest,
  UpdateStatusRequest,
} from '../types/library.interface';

export function useUpdateLibraryStatus() {
  const queryClient = useQueryClient();
  return useMutation<LibraryItem, Error, UpdateStatusRequest>({
    mutationFn: updateLibraryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      queryClient.invalidateQueries({ queryKey: recommendationsKeys.all });
    },
  });
}

export function useUpdateReadingProgress() {
  const queryClient = useQueryClient();
  return useMutation<UpdateReadingProgressResult, Error, UpdateProgressRequest>({
    mutationFn: updateReadingProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}

export function useAddBookToCollections() {
  const queryClient = useQueryClient();
  return useMutation<LibraryItem, Error, AddToCollectionsRequest>({
    mutationFn: addBookToCollections,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}

export function useRemoveBookFromLibrary() {
  const queryClient = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: removeBookFromLibrary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation<Collection, Error, CreateCollectionRequest>({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation<Collection, Error, { id: string; data: UpdateCollectionRequest }>({
    mutationFn: updateCollection,
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.collectionDetail(id) });
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}

export function useRecordReadingTime() {
  return useMutation<void, Error, { bookId: string; chapterId: string; durationInSeconds: number }>({
    mutationFn: recordReadingTime,
  });
}