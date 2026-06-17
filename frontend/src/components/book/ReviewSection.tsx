'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useReviewForm } from '@/features/reviews/hooks/useReviewForm';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Heart, Info, Loader2, MessageCircle, Pencil, Trash2, Star } from 'lucide-react';
import { useAppAuth } from '@/features/auth/hooks';
import { useGetBookLibraryInfoQuery } from '@/features/library/api/libraryApi';
import type { Review } from '@/features/reviews/types/review.interface';

export const ReviewSection = ({ bookId, bookSlug }: { bookId: string; bookSlug: string }) => {
    const { isAuthenticated, user } = useAppAuth();
    const { data: libraryInfo } = useGetBookLibraryInfoQuery(bookId, { skip: !isAuthenticated });

    const completedCount = libraryInfo?.completedChaptersCount || 0;
    const totalChapters = libraryInfo?.totalChapters || 0;
    const requiredChapters = Math.min(10, totalChapters);
    const hasEnoughChapters = !!libraryInfo && completedCount >= requiredChapters;

    const {
        reviews,
        isLoadingReviews,
        isCreating,
        isUpdating,
        editingReviewId,
        rating,
        content,
        setRating,
        setContent,
        handleSubmit,
        handleEdit,
        handleDelete,
        handleCancelEdit,
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
                </div>
            </CardHeader>

            <CardContent className="px-0 pt-6">
                {isAuthenticated && (
                    <form
                        onSubmit={handleSubmit}
                        className="mb-8 bg-muted/20 p-4 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {editingReviewId ? 'Chỉnh sửa đánh giá' : 'Đánh giá của bạn'}
                            </span>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none hover:scale-110 transition-transform"
                                    >
                                        <Star
                                            size={18}
                                            className={
                                                star <= rating
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-muted-foreground/30'
                                            }
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[80px] mb-3 bg-background border-border/50 resize-none focus-visible:ring-primary text-sm"
                            placeholder="Chia sẻ cảm nhận của bạn về cuốn sách..."
                        />

                        {!hasEnoughChapters && !!libraryInfo && !editingReviewId && (
                            <div className="mb-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-md">
                                <Info size={14} />
                                <span>Đọc thêm {requiredChapters - completedCount} chương nữa để gửi đánh giá ({completedCount}/{requiredChapters})</span>
                            </div>
                        )}

                        {(hasEnoughChapters || editingReviewId) && (
                            <div className="flex justify-end gap-2">
                                {editingReviewId && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleCancelEdit}
                                        size="sm"
                                        className="h-8 text-xs px-4"
                                    >
                                        HỦY
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    size="sm"
                                    className="h-8 bg-primary text-primary-foreground font-bold text-xs px-5"
                                >
                                    {isCreating
                                        ? 'ĐANG GỬI...'
                                        : isUpdating
                                            ? 'ĐANG CẬP NHẬT...'
                                            : editingReviewId
                                                ? 'CẬP NHẬT'
                                                : 'GỬI ĐÁNH GIÁ'}
                                </Button>
                            </div>
                        )}
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
                        reviews?.map((review: Review) => (
                            <div
                                key={review.id}
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
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => handleLike(review.id)}
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

                                            {user?.id === review.userId && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(review)}
                                                        className="p-1.5 text-muted-foreground/50 hover:text-sky-600 transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
                                                                handleDelete(review.id);
                                                            }
                                                        }}
                                                        className="p-1.5 text-muted-foreground/50 hover:text-red-600 transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
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
