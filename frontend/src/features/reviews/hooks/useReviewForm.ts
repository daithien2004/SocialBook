import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import {
    useCreateReviewMutation,
    useGetReviewsByBookQuery,
    useToggleLikeReviewMutation,
} from '@/features/reviews/api/reviewApi';
import { booksApi, BOOK_TAGS } from '@/features/books/api/bookApi';

export interface UseReviewFormOptions {
    bookId: string;
    bookSlug: string;
}

export interface UseReviewFormResult {
    reviews: ReturnType<typeof useGetReviewsByBookQuery>['data'];
    isLoadingReviews: boolean;
    isCreating: boolean;
    isOpen: boolean;
    rating: number;
    content: string;
    setIsOpen: (open: boolean) => void;
    setRating: (rating: number) => void;
    setContent: (content: string) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
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
    const [toggleLikeReview] = useToggleLikeReviewMutation();

    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');

    const resetForm = useCallback(() => {
        setIsOpen(false);
        setContent('');
        setRating(5);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            toast.error('Vui lòng nhập nội dung');
            return;
        }
        try {
            await createReview({ bookId, content, rating }).unwrap();
            dispatch(booksApi.util.invalidateTags([{ type: BOOK_TAGS.BOOK_DETAIL, id: bookSlug }]));
            resetForm();
            toast.success('Đánh giá thành công!');
        } catch (err: any) {
            if (err?.status !== 401) {
                toast.error(getErrorMessage(err));
            }
        }
    }, [bookId, bookSlug, content, rating, createReview, dispatch, resetForm]);

    const handleLike = useCallback(async (reviewId: string) => {
        try {
            await toggleLikeReview({ id: reviewId, bookId }).unwrap();
        } catch (error: any) {
            if (error?.status !== 401) {
                toast.error('Lỗi khi thích đánh giá');
            }
        }
    }, [bookId, toggleLikeReview]);

    return {
        reviews,
        isLoadingReviews,
        isCreating,
        isOpen,
        rating,
        content,
        setIsOpen,
        setRating,
        setContent,
        handleSubmit,
        handleLike,
        resetForm,
    };
}
