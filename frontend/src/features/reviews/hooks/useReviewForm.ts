import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import {
    useCreateReviewMutation,
    useUpdateReviewMutation,
    useDeleteReviewMutation,
    useGetReviewsByBookQuery,
    useToggleLikeReviewMutation,
} from '@/features/reviews/api/reviewApi';
import { booksApi, BOOK_TAGS } from '@/features/books/api/bookApi';
import type { Review } from '@/features/reviews/types/review.interface';

export interface UseReviewFormOptions {
    bookId: string;
    bookSlug: string;
}

export interface UseReviewFormResult {
    reviews: ReturnType<typeof useGetReviewsByBookQuery>['data'];
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
    const dispatch = useDispatch();

    const { data: reviews, isLoading: isLoadingReviews } = useGetReviewsByBookQuery(bookId, {
        skip: !bookId,
    });
    const [createReview, { isLoading: isCreating }] = useCreateReviewMutation();
    const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation();
    const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();
    const [toggleLikeReview] = useToggleLikeReviewMutation();

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

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            toast.error('Vui lòng nhập nội dung');
            return;
        }
        try {
            if (editingReviewId) {
                await updateReview({
                    id: editingReviewId,
                    data: { content, rating },
                    bookId,
                }).unwrap();
                toast.success('Cập nhật đánh giá thành công!');
            } else {
                await createReview({ bookId, content, rating }).unwrap();
                dispatch(booksApi.util.invalidateTags([{ type: BOOK_TAGS.BOOK_DETAIL, id: bookSlug }]));
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
    }, [bookId, bookSlug, content, rating, editingReviewId, createReview, updateReview, dispatch, resetForm]);

    const handleDelete = useCallback(async (reviewId: string) => {
        try {
            await deleteReview({ id: reviewId, bookId }).unwrap();
            toast.success('Xóa đánh giá thành công!');
        } catch {
            toast.error('Lỗi khi xóa đánh giá');
        }
    }, [bookId, deleteReview]);

    const handleLike = useCallback(async (reviewId: string) => {
        try {
            await toggleLikeReview({ id: reviewId, bookId }).unwrap();
        } catch {
            toast.error('Lỗi khi thích đánh giá');
        }
    }, [bookId, toggleLikeReview]);

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
