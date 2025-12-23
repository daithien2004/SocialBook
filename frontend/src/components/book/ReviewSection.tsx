'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { MessageCircle, Star, Send, Heart } from 'lucide-react';
import {
  useGetReviewsByBookQuery,
  useCreateReviewMutation,
  useToggleLikeReviewMutation,
} from '@/src/features/reviews/api/reviewApi';

export const ReviewSection = ({ bookId }: { bookId: string }) => {
  const { data: reviews, isLoading } = useGetReviewsByBookQuery(bookId, {
    skip: !bookId,
  });
  const [createReview, { isLoading: isCreating }] = useCreateReviewMutation();
  const [toggleLikeReview] = useToggleLikeReviewMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return toast.error('Vui lòng nhập nội dung');
    try {
      await createReview({ bookId, content, rating }).unwrap();
      setIsOpen(false);
      setContent('');
      setRating(5);
      toast.success('Đánh giá thành công!');
    } catch (err: any) {
      if (err?.status !== 401) {
        toast.error(err?.data?.message || 'Lỗi khi gửi đánh giá');
      }
    }
  };

  const handleLike = async (reviewId: string) => {
    try {
      await toggleLikeReview({ id: reviewId, bookId }).unwrap();
    } catch (error: any) {
      if (error?.status !== 401) {
        toast.error('Lỗi khi thích đánh giá');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-white/10 rounded-xl p-6 md:p-8 shadow-sm dark:shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <MessageCircle className="text-red-600 dark:text-red-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
            Đánh giá{' '}
            <span className="text-gray-500 text-base normal-case">
              ({reviews?.length || 0})
            </span>
          </h2>
        </div>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-red-600 hover:text-white text-gray-700 dark:text-gray-300 rounded-lg transition-all text-sm font-medium"
          >
            Viết đánh giá
          </button>
        )}
      </div>

      {/* Form */}
      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 bg-gray-50 dark:bg-[#1a1a1a]/70 p-6 rounded-lg border border-gray-200 dark:border-white/5"
        >
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none hover:scale-110 transition-transform"
                >
                  <Star
                    size={28}
                    className={
                      star <= rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300 dark:text-gray-600'
                    }
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-red-500 outline-none resize-none mb-4"
            rows={4}
            placeholder="Chia sẻ cảm nhận chân thực của bạn..."
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
            >
              {isCreating ? (
                'Đang gửi...'
              ) : (
                <>
                  <Send size={18} /> Gửi đánh giá
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : reviews?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Chưa có đánh giá nào. Hãy là người đầu tiên!
          </div>
        ) : (
          reviews?.map((review: any) => (
            <div
              key={review.id || review._id}
              className="bg-gray-50 dark:bg-[#1a1a1a]/70 p-5 rounded-lg border border-gray-200 dark:border-white/5"
            >
              <div className="flex gap-4">
                <div className="flex-none">
                  <div className="w-12 h-12 relative rounded-full overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-200">
                    {review.userId?.image ? (
                      <Image
                        src={review.userId.image}
                        alt="User"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                        {review.userId?.username?.[0]}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {review.userId?.username}
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={
                            i < review.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
                    {review.content}
                  </p>
                  <button
                    onClick={() => handleLike(review.id || review._id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                      review.isLiked
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-white dark:bg-white/5 text-gray-500 border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Heart
                      size={14}
                      className={review.isLiked ? 'fill-current' : ''}
                    />{' '}
                    <span>Hữu ích ({review.likesCount || 0})</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
