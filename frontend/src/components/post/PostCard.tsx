'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePostToggleLikeMutation } from '@/features/likes/api/likeApi';
import {
    useDeletePostImageMutation,
    useDeletePostMutation,
} from '@/features/posts/api/postApi';
import { Post } from '@/features/posts/types/post.interface';
import { useAppAuth } from '@/hooks/useAppAuth';
import { getErrorMessage, cn } from '@/lib/utils';
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
import React, { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useModalStore } from '@/store/useModalStore';

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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

interface PostCardProps {
    post: Post;
}


const PostCard = memo(function PostCard({ post }: PostCardProps) {
    const { openEditPost, openSharePost, openPostComment } = useModalStore();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);
    const [optimisticLikeCount, setOptimisticLikeCount] = useState(post.totalLikes ?? 0);
    const [optimisticLikeStatus, setOptimisticLikeStatus] = useState(post.likedByCurrentUser ?? false);
    const route = useRouter();
    const { user } = useAppAuth();

    const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
    const [deleteImage] = useDeletePostImageMutation();
    const [toggleLike] = usePostToggleLikeMutation();

    const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${post.id}`;
    const shareTitle = post.content?.slice(0, 100) || 'Xem bài viết này';
    const shareMedia = post.imageUrls?.[0] || '/abstract-book-pattern.png';


    const isOwner = post.user?.id === user?.id;
    const hasPostImages = post.imageUrls && post.imageUrls.length > 0;
    const displayedLikeCount = optimisticLikeCount;
    const displayedLikeStatus = optimisticLikeStatus;
    const displayedCommentCount = post.totalComments ?? 0;

    useEffect(() => {
        setOptimisticLikeCount(post.totalLikes ?? 0);
    }, [post.totalLikes]);

    useEffect(() => {
        setOptimisticLikeStatus(post.likedByCurrentUser ?? false);
    }, [post.likedByCurrentUser]);

    const handleDelete = useCallback(async () => {
        try {
            await deletePost(post.id).unwrap();
            toast.success('Xóa bài viết thành công!');
            setShowDeleteConfirm(false);
        } catch (error: unknown) {
            console.error('Failed to delete post:', error);
            if ((error as { status?: number })?.status !== 401) {
                toast.error(getErrorMessage(error));
            }
        }
    }, [deletePost, post.id]);

    const handleDeleteImage = useCallback(async () => {
        if (!imageToDelete) return;

        try {
            await deleteImage({
                id: post.id,
                data: { imageUrl: imageToDelete },
            }).unwrap();

            if (currentImageIndex >= (post.imageUrls?.length || 1) - 1) {
                setCurrentImageIndex((prev) => Math.max(0, prev - 1));
            }

            toast.success('Xóa ảnh thành công!');
            setShowDeleteImageConfirm(false);
            setImageToDelete(null);
        } catch (error: unknown) {
            console.error('Failed to delete image:', error);
            if ((error as { status?: number })?.status !== 401) {
                toast.error(getErrorMessage(error));
            }
        }
    }, [deleteImage, post.id, currentImageIndex, post.imageUrls?.length, imageToDelete]);

    const openDeleteImageConfirm = useCallback((imageUrl: string) => {
        setImageToDelete(imageUrl);
        setShowDeleteImageConfirm(true);
    }, []);

    const nextImage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (post.imageUrls && currentImageIndex < post.imageUrls.length - 1) {
            setCurrentImageIndex((prev) => prev + 1);
        }
    }, [currentImageIndex, post.imageUrls]);

    const prevImage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentImageIndex > 0) {
            setCurrentImageIndex((prev) => prev - 1);
        }
    }, [currentImageIndex]);

    const handleLike = useCallback(async () => {
        try {
            const nextLiked = !displayedLikeStatus;

            setOptimisticLikeStatus(nextLiked);
            setOptimisticLikeCount((prev) =>
                nextLiked ? prev + 1 : Math.max(0, prev - 1)
            );

            await toggleLike({
                targetId: post.id,
                targetType: 'post',
            }).unwrap();
        } catch (error) {
            setOptimisticLikeStatus(post.likedByCurrentUser ?? false);
            setOptimisticLikeCount(post.totalLikes ?? 0);

            console.log('Toggle like failed:', error);
        }
    }, [displayedLikeStatus, post.id, post.likedByCurrentUser, post.totalLikes, toggleLike]);

    const handleOpenShare = useCallback(() => {
        openSharePost({
            postUrl,
            shareTitle,
            shareMedia,
        });
    }, [openSharePost, postUrl, shareTitle, shareMedia]);

    const handleOpenComment = useCallback(() => {
        openPostComment({
            post,
            handleLike,
            commentCount: displayedCommentCount,
            likeStatus: displayedLikeStatus,
            likeCount: displayedLikeCount,
        });
    }, [openPostComment, post, handleLike, displayedCommentCount, displayedLikeStatus, displayedLikeCount]);

    const navigateToUser = useCallback(() => route.push(`users/${post.user.id}`), [route, post.user.id]);
    const navigateToBook = useCallback(() => route.push(`/books/${post.book?.slug}`), [route, post.book?.slug]);
    
    const handleOpenEdit = useCallback(() => openEditPost({ post }), [openEditPost, post]);
    
    const openDeleteConfirm = useCallback(() => setShowDeleteConfirm(true), []);

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
                        onClick={navigateToUser}>
                        <div className="relative">
                            <Avatar className="h-10 w-10 border border-slate-200 dark:border-gray-700">
                                <AvatarImage
                                    src={post.user?.image || '/abstract-book-pattern.png'}
                                    alt={post.user?.username || 'User'}
                                    className="object-cover"
                                />
                                <AvatarFallback>{post.user?.username?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            {/* Chấm trạng thái online */}
                            <span className="absolute bottom-0 right-0 inline-flex h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                                {post.user?.username || post.user?.email || 'Người dùng ẩn danh'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                                {createdDate}
                            </p>
                        </div>
                    </div>

                    {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-slate-100 dark:hover:bg-gray-800" aria-label="Tùy chọn bài viết">
                                    <MoreVertical className="w-4 h-4 text-slate-500 dark:border-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={handleOpenEdit} className="cursor-pointer">
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    <span>Chỉnh sửa bài viết</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={openDeleteConfirm}
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
                {post.book && (
                    <div className="px-4 pb-3">
                        <div
                            className="p-3 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-slate-100 dark:border-gray-800 flex items-start gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800/60 transition-colors"
                            onClick={navigateToBook}
                        >
                            <div className="shrink-0 w-14 h-20 rounded-md overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800">
                                <Image
                                    src={post.book.coverUrl || '/abstract-book-pattern.png'}
                                    alt={post.book.title}
                                    width={56}
                                    height={80}
                                    sizes="56px"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-medium uppercase tracking-wide gap-1 bg-primary/10 text-primary dark:text-primary-foreground/90 hover:bg-primary/20">
                                    <BookOpen size={10} />
                                    Đang đọc
                                </Badge>
                                <h3
                                    className="font-semibold text-sm text-slate-900 dark:text-gray-100 truncate mt-1"
                                    title={post.book.title}
                                >
                                    {post.book.title}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                                    {post.book.authorId?.name || 'Tác giả ẩn danh'}
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
                            <Image
                                src={post.imageUrls![currentImageIndex]}
                                alt={`Post image ${currentImageIndex + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 768px"
                                className="object-contain bg-slate-100 dark:bg-black/20"
                            />
                        </div>

                        {isOwner && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => openDeleteImageConfirm(post.imageUrls![currentImageIndex])}
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
                                    aria-label="Ảnh trước"
                                >
                                    <span className="text-lg leading-none pb-1">‹</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={nextImage}
                                    disabled={currentImageIndex === post.imageUrls!.length - 1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden bg-white/80 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80"
                                    aria-label="Ảnh sau"
                                >
                                    <span className="text-lg leading-none pb-1">›</span>
                                </Button>

                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 p-1 rounded-full bg-black/20 backdrop-blur-[2px]">
                                    {post.imageUrls!.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={cn(
                                                "h-1.5 rounded-full transition-all shadow-sm",
                                                index === currentImageIndex
                                                    ? "bg-white w-6"
                                                    : "bg-white/60 w-1.5 hover:bg-white/80"
                                            )}
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
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLike}
                                className={cn(
                                    "flex-1 gap-2 px-3 text-muted-foreground transition-colors py-5",
                                    displayedLikeStatus 
                                        ? "text-rose-500 dark:text-rose-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20" 
                                        : "hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                                )}
                            >
                                <Heart
                                    size={18}
                                    className={displayedLikeStatus ? 'fill-current' : ''}
                                />
                                <span className="text-sm font-medium">
                                    {displayedLikeStatus ? 'Đã thích' : 'Thích'}
                                </span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenComment}
                                className="flex-1 gap-2 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors py-5"
                            >
                                <MessageCircle className="w-5 h-5"/>
                                <span className="text-sm font-medium">Bình luận</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenShare}
                                className="flex-1 gap-2 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors py-5"
                            >
                                <Send className="w-5 h-5 -rotate-45 mb-1"/>
                                <span className="text-sm font-medium">Chia sẻ</span>
                            </Button>
                        </div>
                    </div>
                    {/* Stats Bar */}
                    {(displayedLikeCount > 0 || displayedCommentCount > 0) && (
                        <div className="px-4 py-2 w-full bg-slate-50/50 dark:bg-gray-900/30 text-xs text-slate-500 dark:text-gray-400 flex gap-4 border-t border-slate-100 dark:border-gray-800/50">
                            {displayedLikeCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <Heart size={12} className="fill-rose-400 text-rose-400" />
                                    {displayedLikeCount} lượt thích
                                </span>
                            )}
                            {displayedCommentCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <MessageCircle size={12} className="fill-primary/60 text-primary/60" />
                                    {displayedCommentCount} bình luận
                                </span>
                            )}
                        </div>
                    )}
                </CardFooter>

                {/* MODALS */}
                {/* Modals are registered globally in RootLayout */}

                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-gray-800">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-gray-100">
                                Xóa bài viết?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600 dark:text-gray-400">
                                Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài viết này chứ?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 gap-3">
                            <AlertDialogCancel 
                                disabled={isDeleting}
                                className="rounded-xl border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800"
                            >
                                Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete();
                                }}
                                disabled={isDeleting}
                                className={cn(
                                    buttonVariants({ variant: "destructive" }),
                                    "rounded-xl gap-2 min-w-[100px]"
                                )}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        <span>Đang xóa...</span>
                                    </>
                                ) : (
                                    "Xóa"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showDeleteImageConfirm} onOpenChange={setShowDeleteImageConfirm}>
                    <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-gray-800">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-gray-100">
                                Xóa ảnh này?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600 dark:text-gray-400">
                                Bạn có chắc chắn muốn xóa ảnh này khỏi bài viết không?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 gap-3">
                            <AlertDialogCancel 
                                className="rounded-xl border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800"
                            >
                                Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteImage();
                                }}
                                className={cn(
                                    buttonVariants({ variant: "destructive" }),
                                    "rounded-xl min-w-[100px]"
                                )}
                            >
                                Xóa
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Card>
        </>
    );
});

export default PostCard;
