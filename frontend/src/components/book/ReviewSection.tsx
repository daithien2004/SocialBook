'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Textarea } from '@/src/components/ui/textarea';
import { BOOK_TAGS, booksApi } from '@/src/features/books/api/bookApi';
import {
  useCreateReviewMutation,
  useGetReviewsByBookQuery,
  useToggleLikeReviewMutation,
} from '@/src/features/reviews/api/reviewApi';
import { getErrorMessage } from '@/src/lib/utils';
import { Heart, MessageCircle, Send, Star } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

export const ReviewSection = ({ bookId, bookSlug }: { bookId: string; bookSlug: string }) => {
  const dispatch = useDispatch();
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
      dispatch(booksApi.util.invalidateTags([{ type: BOOK_TAGS.BOOK_DETAIL, id: bookSlug }]));
      setIsOpen(false);
      setContent('');
      setRating(5);
      toast.success('Đánh giá thành công!');
    } catch (err: any) {
      if (err?.status !== 401) {
        toast.error(getErrorMessage(err));
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
    <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-lg bg-card">
      {/* Header */}
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="text-red-600 dark:text-red-500" size={24} />
            <CardTitle className="text-xl font-bold uppercase tracking-wide flex items-center gap-2">
              Đánh giá{' '}
              <span className="text-muted-foreground text-base normal-case font-normal">
                ({reviews?.length || 0})
              </span>
            </CardTitle>
          </div>
          {!isOpen && (
            <Button
              onClick={() => setIsOpen(true)}
              variant="secondary"
              className="hover:bg-red-600 hover:text-white transition-all font-medium"
            >
              Viết đánh giá
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Form */}
        {isOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 bg-muted/50 p-6 rounded-lg border border-border animate-in fade-in slide-in-from-top-4 duration-300"
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
                          : 'text-muted/30 fill-muted/30'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] mb-4 bg-background resize-none focus-visible:ring-red-500"
              placeholder="Chia sẻ cảm nhận chân thực của bạn..."
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isCreating ? (
                  'Đang gửi...'
                ) : (
                  <>
                    <Send size={18} className="mr-2" /> Gửi đánh giá
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : reviews?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Chưa có đánh giá nào. Hãy là người đầu tiên!
            </div>
          ) : (
            reviews?.map((review: any) => (
              <div
                key={review.id || review._id}
                className="bg-muted/30 p-5 rounded-lg border border-border transition-colors hover:bg-muted/50"
              >
                <div className="flex gap-4">
                  <div className="flex-none">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={review.userId?.image} alt={review.userId?.username} />
                      <AvatarFallback className="font-bold text-muted-foreground bg-muted">
                        {review.userId?.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground">
                        {review.userId?.username}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < review.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-muted-foreground/30 fill-muted-foreground/30'
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                      {review.content}
                    </p>
                    <Button
                      onClick={() => handleLike(review.id || review._id)}
                      variant={review.isLiked ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "rounded-full h-8 px-3 text-xs gap-1.5 border transition-all",
                        review.isLiked
                          ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400"
                          : "border-transparent hover:border-border text-muted-foreground"
                      )}
                    >
                      <Heart
                        size={14}
                        className={review.isLiked ? 'fill-current' : ''}
                      />
                      <span>Hữu ích ({review.likesCount || 0})</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
