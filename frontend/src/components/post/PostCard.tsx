'use client';

import React, {useState} from 'react';
import {
    Heart,
    MessageCircle,
    Send,
    MoreVertical,
    Edit2,
    Trash2,
    X,
    Loader2,
    BookOpen,
} from 'lucide-react';
import {toast} from 'sonner';
import {Post} from '@/src/features/posts/types/post.interface';
import ModalPostComment from '@/src/components/post/ModalPostComment';
import SharePostModal from '@/src/components/post/SharePostModal';
import EditPostForm from '@/src/components/post/EditPostForm';
import {
    useDeletePostMutation,
    useDeletePostImageMutation,
} from '@/src/features/posts/api/postApi';
import {useAppAuth} from '@/src/hooks/useAppAuth';
import {
    useGetCountQuery,
    useGetStatusQuery,
    usePostToggleLikeMutation,
} from '@/src/features/likes/api/likeApi';
import {useGetCommentCountQuery} from '@/src/features/comments/api/commentApi';
import {useRouter} from "next/navigation";

interface PostCardProps {
    post: Post;
}

const PostCard: React.FC<PostCardProps> = ({post}) => {
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showShare, setShowShare] = useState(false);
    const route = useRouter();
    const {user} = useAppAuth();

    const [deletePost, {isLoading: isDeleting}] = useDeletePostMutation();
    const [deleteImage] = useDeletePostImageMutation();
    const [toggleLike] = usePostToggleLikeMutation();

    const {isAuthenticated} = useAppAuth();

    const {data: likeCount, isLoading: isLikeLoading} = useGetCountQuery({
        targetId: post.id,
        targetType: 'post',
    });

    const {data: likeStatus, isLoading: isLikeStatusLoading} = useGetStatusQuery({
        targetId: post.id,
        targetType: 'post',
    }, {
        skip: !isAuthenticated,
    });

    const {data: commentCount} = useGetCommentCountQuery({
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
                toast.error(error?.data?.message || 'Lỗi khi xóa bài viết');
            }
        }
    };

    const handleDeleteImage = async (imageUrl: string) => {
        if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;

        try {
            await deleteImage({
                id: post.id,
                data: {imageUrl},
            }).unwrap();

            if (currentImageIndex >= (post.imageUrls?.length || 1) - 1) {
                setCurrentImageIndex((prev) => Math.max(0, prev - 1));
            }

            toast.success('Xóa ảnh thành công!');
        } catch (error: any) {
            console.error('Failed to delete image:', error);
            if (error?.status !== 401) {
                toast.error(error?.data?.message || 'Lỗi khi xóa ảnh');
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
            console.error('Toggle like failed:', error);
        }
    };

    const createdDate = new Date(post.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return (
        <>
            <article
                className="w-full bg-white/95 dark:bg-[#1a1a1a] rounded-3xl border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 mb-5 overflow-hidden">
                {/* HEADER */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer"
                         onClick={() => route.push(`users/${post.userId.id}`)}>
                        <div className="relative">
                            <img
                                src={
                                    post.userId?.image ||
                                    post.userAvatar ||
                                    '/abstract-book-pattern.png'
                                }
                                alt={post.userId?.username || 'User'}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-gray-700"
                            />
                            {/* Chấm trạng thái online (optional) */}
                            <span
                                className="absolute bottom-0 right-0 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900"/>
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
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu((prev) => !prev)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <MoreVertical className="w-5 h-5 text-slate-500 dark:text-gray-400"/>
                            </button>

                            {showMenu && (
                                <div
                                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-slate-100 dark:border-gray-800 py-1 z-20">
                                    <button
                                        onClick={() => {
                                            setShowEditForm(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
                                    >
                                        <Edit2 className="w-4 h-4"/>
                                        <span>Chỉnh sửa bài viết</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                        <span>Xóa bài viết</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CONTENT */}
                <div className="px-4 pb-3">
                    <p className="text-[15px] leading-relaxed text-slate-800 dark:text-gray-200 whitespace-pre-wrap">
                        {post.content}
                    </p>
                </div>

                {/* BOOK SECTION */}
                {post.bookId && (
                    <div
                        className="mx-4 mb-3 mt-1 p-3 bg-slate-50 dark:bg-gray-900/40 rounded-2xl border border-slate-100 dark:border-gray-800 flex items-start gap-3">
                        <div
                            className="shrink-0 w-16 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800">
                            <img
                                src={post.bookId.coverUrl || '/abstract-book-pattern.png'}
                                alt={post.bookId.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                            <div
                                className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-full">
                                <BookOpen size={13}/>
                                <span className="text-[10px] font-medium uppercase tracking-wide">
                  Đang đọc
                </span>
                            </div>
                            <h3
                                className="font-semibold text-sm text-slate-900 dark:text-gray-100 truncate"
                                title={post.bookId.title}
                            >
                                {post.bookId.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                                {post.bookId.authorId?.name || 'Tác giả ẩn danh'}
                            </p>
                        </div>
                    </div>
                )}

                {/* IMAGES */}
                {hasPostImages && (
                    <div className="relative w-full bg-slate-50 dark:bg-gray-900/30 group">
                        <div className="relative h-80 w-full overflow-hidden">
                            <img
                                src={post.imageUrls![currentImageIndex]}
                                alt={`Post image ${currentImageIndex + 1}`}
                                className="w-full h-full object-contain bg-slate-900/5 dark:bg-white/5"
                            />
                        </div>

                        {isOwner && (
                            <button
                                onClick={() =>
                                    handleDeleteImage(post.imageUrls![currentImageIndex])
                                }
                                className="absolute top-3 right-3 p-2 bg-slate-900/60 dark:bg-black/60 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                title="Xóa ảnh này"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        )}

                        {post.imageUrls!.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    disabled={currentImageIndex === 0}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-slate-800 dark:bg-gray-900/80 dark:hover:bg-gray-900 dark:text-gray-100 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all disabled:hidden"
                                >
                                    ‹
                                </button>
                                <button
                                    onClick={nextImage}
                                    disabled={currentImageIndex === post.imageUrls!.length - 1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-slate-800 dark:bg-gray-900/80 dark:hover:bg-gray-900 dark:text-gray-100 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all disabled:hidden"
                                >
                                    ›
                                </button>

                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {post.imageUrls!.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`h-1.5 rounded-full transition-all shadow-sm ${
                                                index === currentImageIndex
                                                    ? 'bg-white w-6'
                                                    : 'bg-white/60 w-1.5'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="px-4 pb-3 pt-2">
                    <div
                        className="flex justify-between items-center border-t border-slate-100 dark:border-gray-800 pt-3">
                        <div className="flex items-center gap-5">
                            <button
                                onClick={handleLike}
                                disabled={isLikeLoading || isLikeStatusLoading}
                                className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-500 transition-colors group text-sm"
                            >
                                <Heart
                                    size={20}
                                    className={`transition-transform duration-150 group-hover:scale-110 ${
                                        likeStatus?.isLiked ? 'fill-rose-500 text-rose-500' : ''
                                    }`}
                                />
                                <span className="hidden sm:inline">
                  {likeStatus?.isLiked ? 'Đã thích' : 'Thích'}
                </span>
                            </button>

                            <button
                                onClick={openCommentModal}
                                className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group text-sm"
                            >
                                <MessageCircle
                                    size={20}
                                    className="transition-transform duration-150 group-hover:scale-110"
                                />
                                <span className="hidden sm:inline">Bình luận</span>
                            </button>

                            <button
                                onClick={() => setShowShare((prev) => !prev)}
                                className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group text-sm"
                            >
                                <Send
                                    size={20}
                                    className="transition-transform duration-150 group-hover:scale-110 -rotate-45 mt-0.5"
                                />
                                <span className="hidden sm:inline">Chia sẻ</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400"/>
                <span>{likeCount?.count ?? 0} lượt thích</span>
              </span>
                            <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400"/>
                <span>{commentCount?.count ?? 0} bình luận</span>
              </span>
                        </div>
                    </div>
                </div>

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
                    <EditPostForm post={post} onClose={() => setShowEditForm(false)}/>
                )}

                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
                        <div
                            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-6 w-full max-w-sm border border-transparent dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-1">
                                Xóa bài viết?
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-gray-300 mb-5">
                                Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài
                                viết này chứ?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 text-sm font-medium rounded-xl transition-colors"
                                    disabled={isDeleting}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin"/>}
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </article>
        </>
    );
};

export default PostCard;
