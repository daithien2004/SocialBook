'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useReviewForm } from '@/features/reviews/hooks/useReviewForm';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Heart, Loader2, MessageCircle, Star } from 'lucide-react';

export const ReviewSection = ({ bookId, bookSlug }: { bookId: string; bookSlug: string }) => {
    const {
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
    } = useReviewForm({ bookId, bookSlug });

    return (
        <Card className="border-border shadow-none bg-transparent">
            <CardHeader className="px-0 pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="text-foreground" size={20} />
                        <CardTitle className="text-lg font-bold">
                            Đánh giá{' '}
                            <span className="text-muted-foreground text-sm font-normal">
                                ({reviews?.length || 0})
                            </span>
                        </CardTitle>
                    </div>
                    {!isOpen && (
                        <Button
                            onClick={() => setIsOpen(true)}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold uppercase tracking-wider"
                        >
                            Viết đánh giá
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="px-0 pt-6">
                {isOpen && (
                    <form
                        onSubmit={handleSubmit}
                        className="mb-10 bg-muted/30 p-5 rounded-xl border border-border animate-in fade-in slide-in-from-top-2 duration-300"
                    >
                        <div className="mb-6 text-center">
                            <p className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-widest">Bạn đánh giá cuốn sách này thế nào?</p>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none hover:scale-125 transition-transform"
                                    >
                                        <Star
                                            size={24}
                                            className={
                                                star <= rating
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-muted-foreground/20'
                                            }
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[120px] mb-4 bg-background border-border resize-none focus-visible:ring-primary"
                            placeholder="Chia sẻ cảm nhận của bạn về cuốn sách..."
                        />

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="text-xs font-bold"
                            >
                                HỦY
                            </Button>
                            <Button
                                type="submit"
                                disabled={isCreating}
                                size="sm"
                                className="bg-primary text-primary-foreground font-bold text-xs px-6"
                            >
                                {isCreating ? (
                                    'ĐANG GỬI...'
                                ) : (
                                    'GỬI ĐÁNH GIÁ'
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                <div className="space-y-10">
                    {isLoadingReviews ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : reviews?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Chưa có đánh giá nào. Hãy là người đầu tiên!
                        </div>
                    ) : (
                        reviews?.map((review: any) => (
                            <div
                                key={review.id || review._id}
                                className="group"
                            >
                                <div className="flex gap-4">
                                    <div className="flex-none">
                                        <UserAvatar
                                            src={review.user?.image}
                                            name={review.user?.username}
                                            size="sm"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-semibold text-foreground/90">
                                                {review.user?.username}
                                            </span>
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={10}
                                                        className={
                                                            i < review.rating
                                                                ? 'text-amber-400 fill-amber-400'
                                                                : 'text-muted-foreground/20'
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                                            {review.content}
                                        </p>
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => handleLike(review.id || review._id)}
                                                className={cn(
                                                    "flex items-center gap-1.5 text-[10px] font-bold transition-all uppercase tracking-widest",
                                                    review.isLiked
                                                        ? "text-foreground"
                                                        : "text-muted-foreground/50 hover:text-foreground"
                                                )}
                                            >
                                                <Heart
                                                    size={11}
                                                    className={review.isLiked ? 'fill-current' : ''}
                                                />
                                                <span>{review.likesCount || 0}</span>
                                            </button>
                                        </div>
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
