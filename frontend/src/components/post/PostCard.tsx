'use client';

import EditPostForm from '@/components/post/EditPostForm';
import ModalPostComment from '@/components/post/ModalPostComment';
import SharePostModal from '@/components/post/SharePostModal';
import { useGetCommentCountQuery } from '@/features/comments/api/commentApi';
import {
    useGetCountQuery,
    useGetStatusQuery,
    usePostToggleLikeMutation,
} from '@/features/likes/api/likeApi';
import {
    useDeletePostImageMutation,
    useDeletePostMutation,
} from '@/features/posts/api/postApi';
import { Post } from '@/features/posts/types/post.interface';
import { useAppAuth } from '@/hooks/useAppAuth';
import { getErrorMessage } from '@/lib/utils';
import {
    BookOpen,
    Edit2,
    Heart,
    Loader2,
    MessageCircle,
    MoreVertical,
    Send,
    Trash2,
    X,
} from 'lucide-react';
import { useRouter } from "next/navigation";
import React, { useState } from 'react';
import { toast } from 'sonner';

// Shadcn UI
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostCardProps {
    post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showShare, setShowShare] = useState(false);
    const route = useRouter();
    const { user } = useAppAuth();

    const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
    const [deleteImage] = useDeletePostImageMutation();
    const [toggleLike] = usePostToggleLikeMutation();

    const { isAuthenticated } = useAppAuth();

    const { data: likeCount, isLoading: isLikeLoading } = useGetCountQuery({
        targetId: post.id,
        targetType: 'post',
    });

    const { data: likeStatus, isLoading: isLikeStatusLoading } = useGetStatusQuery({
        targetId: post.id,
        targetType: 'post',
    }, {
        skip: !isAuthenticated,
    });

    const { data: commentCount } = useGetCommentCountQuery({
        targetId: post.id,
        targetType: 'post',
    });

    const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
    const postUrl = `${origin}/posts/${post.id}`;
    const shareTitle =
        post.content?.slice(0, 100) || 'Xem bài viết này';
    const shareMedia =
        post.imageUrls && post.imageUrls.length > 0
            ? post.imageUrls[0]
            : postUrl;

    const openCommentModal = () => setIsCommentOpen(true);
    const closeCommentModal = () => setIsCommentOpen(false);

    const isOwner = post.userId?.id === user?.id;
    const hasPostImages = post.imageUrls && post.imageUrls.length > 0;

    const handleDelete = async () => {
        try {
            await deletePost(post.id).unwrap();
            toast.success('Xóa bài viết thành công!');
            setShowDeleteConfirm(false);
        } catch (error: any) {
            console.error('Failed to delete post:', error);
            if (error?.status !== 401) {
                toast.error(getErrorMessage(error));
            }
        }
    };

    const handleDeleteImage = async (imageUrl: string) => {
        if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;

        try {
            await deleteImage({
                id: post.id,
                data: { imageUrl },
            }).unwrap();

            if (currentImageIndex >= (post.imageUrls?.length || 1) - 1) {
                setCurrentImageIndex((prev) => Math.max(0, prev - 1));
            }

            toast.success('Xóa ảnh thành công!');
        } catch (error: any) {
            console.error('Failed to delete image:', error);
            if (error?.status !== 401) {
                toast.error(getErrorMessage(error));
            }
        }
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (post.imageUrls && currentImageIndex < post.imageUrls.length - 1) {
            setCurrentImageIndex((prev) => prev + 1);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentImageIndex > 0) {
            setCurrentImageIndex((prev) => prev - 1);
        }
    };

    const handleLike = async () => {
        try {
            await toggleLike({
                targetId: post.id,
                targetType: 'post',
            }).unwrap();
        } catch (error) {
            console.log('Toggle like failed:', error);
        }
    };

    const createdDate = new Date(post.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return (
        <>
            <Card className="w-full mb-5 overflow-hidden transition-shadow duration-200 hover:shadow-md border-slate-100 dark:border-gray-700 bg-white/95 dark:bg-[#1a1a1a]">
                {/* HEADER */}
                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3 cursor-pointer"
                        onClick={() => route.push(`users/${post.userId.id}`)}>
                        <div className="relative">
                            <Avatar className="h-10 w-10 border border-slate-200 dark:border-gray-700">
                                <AvatarImage
                                    src={post.userId?.image || post.userAvatar || '/abstract-book-pattern.png'}
                                    alt={post.userId?.username || 'User'}
                                    className="object-cover"
                                />
                                <AvatarFallback>{post.userId?.username?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            {/* Chấm trạng thái online (optional) - giữ nguyên logic cũ nếu cần */}
                            <span className="absolute bottom-0 right-0 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                                {post.userId?.username || post.userId?.email || 'Người dùng ẩn danh'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                                {createdDate}
                            </p>
                        </div>
                    </div>

                    {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-slate-100 dark:hover:bg-gray-800">
                                    <MoreVertical className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setShowEditForm(true)} className="cursor-pointer">
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    <span>Chỉnh sửa bài viết</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    <span>Xóa bài viết</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </CardHeader>

                {/* CONTENT */}
                <CardContent className="p-4 pt-0">
                    <p className="text-[15px] leading-relaxed text-slate-800 dark:text-gray-200 whitespace-pre-wrap">
                        {post.content}
                    </p>
                </CardContent>

                {/* BOOK SECTION */}
                {post.bookId && (
                    <div className="px-4 pb-3">
                        <div
                            className="p-3 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-slate-100 dark:border-gray-800 flex items-start gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800/60 transition-colors"
                            onClick={() => route.push(`/books/${post.bookId.slug}`)} // Assuming slug exists
                        >
                            <div className="shrink-0 w-14 h-20 rounded-md overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800">
                                <img
                                    src={post.bookId.coverUrl || '/abstract-book-pattern.png'}
                                    alt={post.bookId.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-medium uppercase tracking-wide gap-1 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50">
                                    <BookOpen size={10} />
                                    Đang đọc
                                </Badge>
                                <h3
                                    className="font-semibold text-sm text-slate-900 dark:text-gray-100 truncate mt-1"
                                    title={post.bookId.title}
                                >
                                    {post.bookId.title}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                                    {post.bookId.authorId?.name || 'Tác giả ẩn danh'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* IMAGES */}
                {hasPostImages && (
                    <div className="relative w-full bg-slate-50 dark:bg-gray-900/30 group border-y border-slate-100 dark:border-gray-800">
                        <div className="relative h-96 w-full overflow-hidden">
                            {/* Improved Image Container */}
                            <img
                                src={post.imageUrls![currentImageIndex]}
                                alt={`Post image ${currentImageIndex + 1}`}
                                className="w-full h-full object-contain bg-slate-100 dark:bg-black/20"
                            />
                        </div>

                        {isOwner && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDeleteImage(post.imageUrls![currentImageIndex])}
                                className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                title="Xóa ảnh này"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}

                        {post.imageUrls!.length > 1 && (
                            <>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={prevImage}
                                    disabled={currentImageIndex === 0}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden bg-white/80 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80"
                                >
                                    <span className="text-lg leading-none pb-1">‹</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={nextImage}
                                    disabled={currentImageIndex === post.imageUrls!.length - 1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden bg-white/80 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80"
                                >
                                    <span className="text-lg leading-none pb-1">›</span>
                                </Button>

                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 p-1 rounded-full bg-black/20 backdrop-blur-[2px]">
                                    {post.imageUrls!.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`h-1.5 rounded-full transition-all shadow-sm ${index === currentImageIndex
                                                ? 'bg-white w-6'
                                                : 'bg-white/60 w-1.5 hover:bg-white/80'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* FOOTER ACTIONS */}
                <CardFooter className="p-0 flex flex-col">
                    <div className="px-4 py-2 w-full flex items-center justify-between border-t border-slate-100 dark:border-gray-800">
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLike}
                                disabled={isLikeLoading || isLikeStatusLoading}
                                className={`gap-2 px-3 text-slate-600 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 ${likeStatus?.isLiked ? 'text-rose-500 dark:text-rose-500' : ''}`}
                            >
                                <Heart
                                    size={18}
                                    className={likeStatus?.isLiked ? 'fill-current' : ''}
                                />
                                <span className="hidden sm:inline">
                                    {likeStatus?.isLiked ? 'Đã thích' : 'Thích'}
                                </span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={openCommentModal}
                                className="gap-2 px-3 text-slate-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                            >
                                <MessageCircle size={18} />
                                <span className="hidden sm:inline">Bình luận</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowShare((prev) => !prev)}
                                className="gap-2 px-3 text-slate-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            >
                                <Send size={18} className="-rotate-45 mt-0.5" />
                                <span className="hidden sm:inline">Chia sẻ</span>
                            </Button>
                        </div>
                        {/* Stats - Optional, keeping it simple or moving to top if preferred. Keeping as is for now but styled better. */}
                    </div>
                    {/* Stats Bar */}
                    {((likeCount?.count ?? 0) > 0 || (commentCount?.count ?? 0) > 0) && (
                        <div className="px-4 py-2 w-full bg-slate-50/50 dark:bg-gray-900/30 text-xs text-slate-500 dark:text-gray-400 flex gap-4 border-t border-slate-100 dark:border-gray-800/50">
                            {(likeCount?.count ?? 0) > 0 && (
                                <span className="flex items-center gap-1">
                                    <Heart size={12} className="fill-rose-400 text-rose-400" />
                                    {likeCount?.count} lượt thích
                                </span>
                            )}
                            {(commentCount?.count ?? 0) > 0 && (
                                <span className="flex items-center gap-1">
                                    <MessageCircle size={12} className="fill-sky-400 text-sky-400" />
                                    {commentCount?.count} bình luận
                                </span>
                            )}
                        </div>
                    )}
                </CardFooter>

                <SharePostModal
                    isOpen={showShare}
                    onClose={() => setShowShare(false)}
                    postUrl={postUrl}
                    shareTitle={shareTitle}
                    shareMedia={shareMedia}
                />

                {/* MODALS */}
                <ModalPostComment
                    post={post}
                    handleLike={handleLike}
                    isCommentOpen={isCommentOpen}
                    closeCommentModal={closeCommentModal}
                    commentCount={commentCount?.count}
                    likeStatus={likeStatus?.isLiked}
                    likeCount={likeCount?.count}
                />

                {showEditForm && (
                    <EditPostForm post={post} onClose={() => setShowEditForm(false)} />
                )}

                {/* Styled Delete Confirm Dialog - Could use Shadcn AlertDialog here too, but simple conditional render is fine for now or I can reuse Dialog */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <Card className="w-full max-w-sm shadow-xl border-none">
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
                                    Xóa bài viết?
                                </h3>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 dark:text-gray-300">
                                    Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài viết này chứ?
                                </p>
                            </CardContent>
                            <CardFooter className="flex gap-3 justify-end bg-slate-50 dark:bg-gray-900/50 p-4 rounded-b-xl">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="gap-2"
                                >
                                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Xóa
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </Card>
        </>
    );
};

export default PostCard;
