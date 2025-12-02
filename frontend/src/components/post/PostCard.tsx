'use client';

import React, { useState } from 'react';
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
import { Post } from '@/src/features/posts/types/post.interface';
import ModalPostComment from '@/src/components/post/ModalPostComment';
import EditPostForm from '@/src/components/post/EditPostForm';
import {
  useDeletePostMutation,
  useDeletePostImageMutation,
} from '@/src/features/posts/api/postApi';
import { useSession } from 'next-auth/react';
import {useGetCountQuery, useGetStatusQuery, usePostToggleLikeMutation} from "@/src/features/likes/api/likeApi";
import {useGetCommentCountQuery} from "@/src/features/comments/api/commentApi";

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: session } = useSession();
  const user = session?.user;

  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [deleteImage] = useDeletePostImageMutation();
  const [toggleLike] = usePostToggleLikeMutation();
  const { data: likeCount, isLoading: isLikeLoading } = useGetCountQuery({
    targetId: post.id,
    targetType: "post",
  });
  const { data: likeStatus, isLoading: isLikeStatusLoading } = useGetStatusQuery({
    targetId: post.id,
    targetType: "post",
  });
  const { data: commentCount, isLoading: isCommentLoading } = useGetCommentCountQuery({
    targetId: post.id,
    targetType: "post",
  });

  const openCommentModal = () => setIsCommentOpen(true);
  const closeCommentModal = () => setIsCommentOpen(false);

  const isOwner = post.userId?.id === user?.id;
  const hasPostImages = post.imageUrls && post.imageUrls.length > 0;

  const handleDelete = async () => {
    try {
      await deletePost(post.id).unwrap();
      alert('Xóa bài viết thành công!');
      setShowDeleteConfirm(false);
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      alert(error?.data?.message || 'Lỗi khi xóa bài viết');
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;

    try {
      await deleteImage({
        id: post.id,
        data: { imageUrl },
      }).unwrap();

      // Reset index if needed to avoid out of bounds
      if (currentImageIndex >= (post.imageUrls?.length || 1) - 1) {
        setCurrentImageIndex(Math.max(0, currentImageIndex - 1));
      }

      alert('Xóa ảnh thành công!');
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      alert(error?.data?.message || 'Lỗi khi xóa ảnh');
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.imageUrls && currentImageIndex < post.imageUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleLike = async () => {
    try {
      const res = await toggleLike({
        targetId: post.id,
        targetType: "post",
      }).unwrap();
    } catch (error) {
      console.error("Toggle like failed:", error);
    }
  };
  return (
    <>
      <div className="w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
        {/* 1. HEADER: User Info & Menu */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={
                post.userId?.image ||
                post.userAvatar ||
                '/abstract-book-pattern.png'
              }
              alt={post.userId?.username || 'User'}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {post.userId?.username || post.userId?.email || 'Unknown User'}
              </h2>
              <p className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                  <button
                    onClick={() => {
                      setShowEditForm(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition text-left text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Chỉnh sửa</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-red-50 text-red-600 transition text-left text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa bài viết</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. BODY: Content Text */}
        <div className="px-4 pb-2">
          <p className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* 3. BOOK SECTION: Hiển thị sách riêng biệt */}
        {post.bookId && (
          <div className="mx-4 mt-3 mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-4 transition hover:bg-blue-50">
            <div className="shrink-0 w-16 h-24 rounded-md overflow-hidden shadow-sm">
              <img
                src={post.bookId.coverUrl || '/abstract-book-pattern.png'}
                alt={post.bookId.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <BookOpen size={14} />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Đang đọc
                </span>
              </div>
              <h3
                className="font-bold text-gray-900 text-base truncate"
                title={post.bookId.title}
              >
                {post.bookId.title}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {post.bookId.authorId?.name || 'Tác giả ẩn danh'}
              </p>
            </div>
          </div>
        )}

        {/* 4. POST IMAGES: Carousel hiển thị ảnh người dùng upload */}
        {hasPostImages && (
          <div className="relative w-full bg-gray-100 group">
            {/* Tỷ lệ khung hình: Có thể chỉnh h-64, h-96 hoặc aspect-square tùy ý */}
            <div className="relative h-80 w-full overflow-hidden">
              <img
                src={post.imageUrls![currentImageIndex]}
                alt={`Post image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain bg-black/5"
                /* Dùng object-contain để thấy toàn bộ ảnh, hoặc object-cover để lấp đầy */
              />
            </div>

            {/* Delete Image Button (Only for Owner) */}
            {isOwner && (
              <button
                onClick={() =>
                  handleDeleteImage(post.imageUrls![currentImageIndex])
                }
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                title="Xóa ảnh này"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Navigation Buttons */}
            {post.imageUrls!.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  disabled={currentImageIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all disabled:hidden"
                >
                  ‹
                </button>
                <button
                  onClick={nextImage}
                  disabled={currentImageIndex === post.imageUrls!.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all disabled:hidden"
                >
                  ›
                </button>

                {/* Dots Indicators */}
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

        {/* 5. ACTIONS FOOTER */}
        <div className="p-4">
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors group">
                <Heart
                  size={22}
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                      likeStatus?.isLiked ? 'fill-red-500 text-red-500' : ''
                  }`}
                  onClick={()=>{handleLike()}}
                />
              </button>

              <button
                onClick={openCommentModal}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <MessageCircle
                  size={22}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
              </button>

              <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group">
                <Send
                  size={22}
                  className="transition-transform duration-200 group-hover:scale-110 -rotate-45 mt-1"
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* Likes Summary */}
              <div className="flex items-center gap-2 text-gray-600 group">
                    <span className="text-sm font-medium">
                  {likeCount?.count ?? 0} lượt thích
                  </span>
                  </div>

                  {/* Comments Summary */}
                  <div className="flex items-center gap-2 text-gray-600 group">
                    <span className="text-sm font-medium">
                      {commentCount?.count ?? 0} bình luận
                     </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <ModalPostComment
          post={post}
          isCommentOpen={isCommentOpen}
          closeCommentModal={closeCommentModal}
        />

        {showEditForm && (
          <EditPostForm post={post} onClose={() => setShowEditForm(false)} />
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Xóa bài viết?
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
                  disabled={isDeleting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PostCard;
