import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { reviewQueries } from '@/features/reviews/api/review.queries';
import { useCreateReview, useUpdateReview, useDeleteReview, useToggleLikeReview } from '@/features/reviews/api/review.mutations';
import { bookKeys } from '@/lib/query-keys';
import { queryClient } from '@/lib/query-client';
import type { Review } from '../types/review.interface';

export interface UseReviewFormOptions {
  bookId: string;
  bookSlug: string;
}

export interface UseReviewFormResult {
  reviews: Review[] | undefined;
  isLoadingReviews: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  editingReviewId: string | null;
  isOpen: boolean;
  rating: number;
  content: string;
  setIsOpen: (open: boolean) => void;
  setRating: (rating: number) => void;
  setContent: (content: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleEdit: (review: Review) => void;
  handleDelete: (reviewId: string) => Promise<void>;
  handleCancelEdit: () => void;
  handleLike: (reviewId: string) => Promise<void>;
  resetForm: () => void;
}

export function useReviewForm({
  bookId,
  bookSlug,
}: UseReviewFormOptions): UseReviewFormResult {
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    ...reviewQueries.byBook(bookId),
    enabled: !!bookId,
  });
  const createReview = useCreateReview();
  const isCreating = createReview.isPending;
  const updateReview = useUpdateReview();
  const isUpdating = updateReview.isPending;
  const deleteReview = useDeleteReview();
  const isDeleting = deleteReview.isPending;
  const toggleLikeReview = useToggleLikeReview();

  const [isOpen, setIsOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');

  const resetForm = useCallback(() => {
    setIsOpen(false);
    setEditingReviewId(null);
    setContent('');
    setRating(5);
  }, []);

  const handleCancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleEdit = useCallback((review: Review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setContent(review.content);
    setIsOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim()) {
        toast.error('Vui lòng nhập nội dung');
        return;
      }
      try {
        if (editingReviewId) {
          await updateReview.mutateAsync({
            id: editingReviewId,
            data: { content, rating },
            bookId,
          });
          toast.success('Cập nhật đánh giá thành công!');
        } else {
          await createReview.mutateAsync({ bookId, content, rating });
          queryClient.invalidateQueries({
            queryKey: bookKeys.detail(bookSlug),
          });
          toast.success('Đánh giá thành công!');
        }
        resetForm();
      } catch (err) {
        const message = getErrorMessage(err);
        if (message.includes('cần đọc ít nhất')) {
          toast.info(message);
        } else {
          toast.error(message);
        }
      }
    },
    [
      bookId,
      bookSlug,
      content,
      rating,
      editingReviewId,
      createReview,
      updateReview,
      resetForm,
    ],
  );

  const handleDelete = useCallback(
    async (reviewId: string) => {
      try {
        await deleteReview.mutateAsync({ id: reviewId, bookId });
        toast.success('Xóa đánh giá thành công!');
      } catch {
        toast.error('Lỗi khi xóa đánh giá');
      }
    },
    [bookId, deleteReview],
  );

  const handleLike = useCallback(
    async (reviewId: string) => {
      try {
        await toggleLikeReview.mutateAsync({ id: reviewId, bookId });
      } catch {
        toast.error('Lỗi khi thích đánh giá');
      }
    },
    [bookId, toggleLikeReview],
  );

  return {
    reviews,
    isLoadingReviews,
    isCreating,
    isUpdating,
    isDeleting,
    editingReviewId,
    isOpen,
    rating,
    content,
    setIsOpen,
    setRating,
    setContent,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCancelEdit,
    handleLike,
    resetForm,
  };
}
