'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import {
  useGetBookBySlugQuery,
  useLikeBookMutation,
} from '@/src/features/books/api/bookApi';
import {
  useGetReviewsByBookQuery,
  useCreateReviewMutation,
  useToggleLikeReviewMutation,
} from '@/src/features/reviews/api/reviewApi';
import { useCreatePostMutation } from '@/src/features/posts/api/postApi';
import { HeaderClient } from '@/src/components/HeaderClient';

import AddToLibraryModal from '@/src/components/library/AddToLibraryModal';
import CreatePostModal, {
  CreatePostData,
} from '@/src/components/post/CreatePostModal';

import {
  Star,
  Eye,
  Heart,
  BookOpen,
  MessageCircle,
  Share2,
  Bookmark,
  Calendar,
  Send,
  X,
  Check,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface BookDetailClientProps {
  bookSlug: string;
}

export default function BookDetailClient({ bookSlug }: BookDetailClientProps) {
  // State cho các modal
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [ratingInput, setRatingInput] = useState(5);
  const [contentInput, setContentInput] = useState('');

  // Mutations
  const [likeBook, { isLoading: isLiking }] = useLikeBookMutation();
  const [createPost, { isLoading: isCreatingPost }] = useCreatePostMutation();
  const [toggleLikeReview] = useToggleLikeReviewMutation();

  // Handle Like Review
  const handleLikeReview = async (reviewId: string) => {
    if (!book?.id) return;
    try {
      await toggleLikeReview({ id: reviewId, bookId: book.id }).unwrap();
    } catch (_error) {
      toast.error('Không thể thích đánh giá này');
    }
  };

  // Fetch Book Detail
  const {
    data: book,
    isLoading: isLoadingBook,
    error,
  } = useGetBookBySlugQuery({ bookSlug });

  // Fetch Reviews
  const { data: reviews, isLoading: isLoadingReviews } =
    useGetReviewsByBookQuery(book?.id as string, { skip: !book?.id });

  // Mutation tạo Review
  const [createReview, { isLoading: isCreating }] = useCreateReviewMutation();

  // Handle Toggle Like
  const handleToggleLike = async () => {
    if (!book?.id) return;
    try {
      await likeBook(book.slug).unwrap();
    } catch (_error) {
      toast.error('Không thể thích sách này');
    }
  };

  // Handle Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book?.id) return;

    if (!contentInput.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }

    try {
      await createReview({
        bookId: book.id,
        content: contentInput,
        rating: ratingInput,
      }).unwrap();

      setIsReviewFormOpen(false);
      setContentInput('');
      setRatingInput(5);

      toast.success('Đánh giá thành công!');
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      // Display the error message from backend
      const errorMessage =
        err?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.';
      toast.error(errorMessage);
    }
  };

  // Handle Share Post
  const handleSharePost = async (data: CreatePostData) => {
    if (!book?.id) {
      throw new Error('Không tìm thấy thông tin sách');
    }

    try {
      await createPost({
        bookId: book.id,
        content: data.content,
        images: data.images,
      }).unwrap();
      toast.success('Chia sẻ thành công!');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể tạo bài viết');
    }
  };

  const defaultShareContent = book
    ? `📚 ${book.title}
✍️ Tác giả: ${book.authorId.name}
⭐ Đánh giá: ${book.averageRating || 0}/5 (${book.totalRatings || 0} đánh giá)
👁️ ${book.views?.toLocaleString()} lượt xem

${book.description}

#${book.title.replace(/\s+/g, '')} #${book.authorId.name.replace(/\s+/g, '')}`
    : '';

  // Loading Skeleton (Adaptive)
  if (isLoadingBook) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#161515] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Error State (Adaptive)
  if (error || !book) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#161515] flex items-center justify-center transition-colors duration-300">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Không tìm thấy sách
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sách bạn tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <Link
            href="/books"
            className="mt-4 inline-block text-gray-900 dark:text-white border-b border-red-500 hover:text-red-500 transition-colors"
          >
            Quay lại thư viện
          </Link>
        </div>
      </div>
    );
  }

  const displayRating = book.stats.averageRating || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161515] text-gray-900 dark:text-gray-100 font-sans selection:bg-red-600 selection:text-white relative transition-colors duration-300">
      {/* --- GLOBAL BACKGROUND FIXED --- */}
      {/* Background image chỉ hiện mờ ở light mode và tối hơn ở dark mode */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/main-background.jpg"
          alt="Background Texture"
          className="w-full h-full object-cover opacity-10 dark:opacity-40"
        />
        {/* Overlay chỉnh màu nền cho phù hợp */}
        <div className="absolute inset-0 bg-white/80 dark:bg-[#0f0f0f]/70 transition-colors duration-300"></div>
      </div>

      <div className="relative z-10">
        <HeaderClient session={null} />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Header Section */}
          <div className="bg-white/60 dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-2xl backdrop-blur-sm transition-all">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Book Cover */}
              <div className="flex-none mx-auto lg:mx-0">
                <div className="w-[240px] h-[360px] md:w-[280px] md:h-[420px] relative rounded-lg overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_rgba(0,0,0,0.6)] group">
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Glossy overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              {/* Book Info */}
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  {book.status === 'completed' ? (
                    <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded text-xs font-bold uppercase tracking-wider">
                      Hoàn thành
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded text-xs font-bold uppercase tracking-wider">
                      Đang cập nhật
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 rounded text-xs font-bold uppercase tracking-wider">
                    {book.publishedYear}
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight drop-shadow-sm dark:drop-shadow-lg">
                  {book.title}
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 flex items-center gap-2">
                  Tác giả:
                  <span className="font-bold text-red-600 dark:text-red-500 hover:underline cursor-pointer">
                    {book.authorId.name}
                  </span>
                </p>

                {/* Stats Grid Mini */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 bg-gray-50 dark:bg-white/5 p-4 rounded-lg border border-gray-200 dark:border-white/5 shadow-inner dark:shadow-none">
                  <div className="text-center border-r border-gray-200 dark:border-white/10 last:border-0">
                    <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold text-xl">
                      {displayRating}
                      <Star size={16} fill="currentColor" />
                    </div>
                    <div className="text-xs text-gray-500 uppercase mt-1">
                      Đánh giá
                    </div>
                  </div>
                  <div className="text-center border-r border-gray-200 dark:border-white/10 last:border-0">
                    <div className="font-bold text-xl text-gray-900 dark:text-white">
                      {book.views?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 uppercase mt-1">
                      Lượt xem
                    </div>
                  </div>
                  <div className="text-center border-r border-gray-200 dark:border-white/10 last:border-0">
                    <div className="font-bold text-xl text-gray-900 dark:text-white">
                      {book.likes?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 uppercase mt-1">
                      Yêu thích
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl text-gray-900 dark:text-white">
                      {book.chapters?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500 uppercase mt-1">
                      Chương
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  {book.chapters?.length > 0 && (
                    <Link
                      href={`/books/${bookSlug}/chapters/${book.chapters[0].slug}`}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-red-500/30 dark:shadow-red-900/50 transform hover:-translate-y-1"
                    >
                      <BookOpen size={20} fill="currentColor" />
                      Đọc ngay
                    </Link>
                  )}

                  <button
                    onClick={() => setIsLibraryModalOpen(true)}
                    className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white text-gray-700 dark:text-white px-6 py-3 rounded-full font-semibold transition-all shadow-sm dark:shadow-none"
                  >
                    <Bookmark size={20} />
                    Thêm vào thư viện
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleToggleLike}
                      disabled={isLiking}
                      className={`p-3 rounded-full border transition-all ${
                        book.isLiked
                        ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/20 dark:border-red-500 dark:text-red-500'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/20 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-white dark:hover:text-white'
                      }`}
                      title={book.isLiked ? 'Bỏ thích' : 'Yêu thích'}
                    >
                      <Heart
                        size={20}
                        className={book.isLiked ? 'fill-current' : ''}
                      />
                    </button>

                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="p-3 rounded-full border bg-white dark:bg-white/5 border-gray-200 dark:border-white/20 text-gray-400 hover:text-gray-900 hover:border-gray-300 dark:hover:border-white dark:hover:text-white transition-all"
                      title="Chia sẻ sách"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description Detail */}
              <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-white/10 rounded-xl p-6 md:p-8 shadow-sm dark:shadow-lg transition-colors">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
                  <BookOpen
                    className="text-red-600 dark:text-red-500"
                    size={24}
                  />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    Giới thiệu tác phẩm
                  </h2>
                </div>
                <div className="text-gray-600 dark:text-gray-300 leading-relaxed space-y-4 text-base md:text-lg font-light">
                  <p>{book.description}</p>
                  <p className="text-gray-500 dark:text-gray-400 italic border-l-2 border-red-500 pl-4 bg-gray-50 dark:bg-transparent py-2 pr-2">
                    "Cuốn sách {book.title} của tác giả {book.authorId.name}{' '}
                    mang đến một câu chuyện đầy cảm xúc và ý nghĩa..."
                  </p>
                </div>
                {/* Tags */}
                {book.tags?.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {book.tags.map((tag: string) => (
                        <Link
                          key={tag}
                          href={`/books?tags=${encodeURIComponent(tag)}`}
                          className="px-3 py-1 bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/5 hover:border-red-300 dark:hover:border-red-500/50 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md text-xs transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* REVIEWS SECTION */}
              <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-white/10 rounded-xl p-6 md:p-8 shadow-sm dark:shadow-lg transition-colors">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <MessageCircle
                      className="text-red-600 dark:text-red-500"
                      size={24}
                    />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                      Đánh giá{' '}
                      <span className="text-gray-500 text-base normal-case">
                        ({reviews?.length})
                      </span>
                    </h2>
                  </div>
                  {!isReviewFormOpen && (
                    <button
                      onClick={() => setIsReviewFormOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all text-sm font-medium border border-gray-200 dark:border-white/10 hover:border-red-600"
                    >
                      Viết đánh giá
                    </button>
                  )}
                </div>

                {isReviewFormOpen && (
                  <div className="mb-8 bg-gray-50 dark:bg-[#1a1a1a]/70 p-6 rounded-lg border border-gray-200 dark:border-white/5">
                    <form onSubmit={handleSubmitReview}>
                      <div className="mb-6">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                          Chấm điểm tác phẩm:
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingInput(star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                size={28}
                                className={`${
                                  star <= ratingInput
                                  ? 'text-yellow-500 fill-yellow-500 drop-shadow-sm'
                                  : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                          Nội dung đánh giá:
                        </label>
                        <textarea
                          value={contentInput}
                          onChange={(e) => setContentInput(e.target.value)}
                          className="w-full p-4 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
                          rows={4}
                          placeholder="Chia sẻ cảm nhận chân thực của bạn..."
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsReviewFormOpen(false)}
                          className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5 rounded-lg transition-colors font-medium"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={isCreating}
                          className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-bold shadow-lg shadow-red-500/20 dark:shadow-none"
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
                  </div>
                )}

                {/* DANH SÁCH REVIEW */}
                <div className="space-y-6">
                  {isLoadingReviews ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                  ) : reviews?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5">
                      <MessageCircle
                        size={40}
                        className="mx-auto text-gray-400 dark:text-gray-600 mb-3"
                      />
                      <p className="text-gray-500 dark:text-gray-400">
                        Chưa có đánh giá nào. Hãy là người đầu tiên!
                      </p>
                    </div>
                  ) : (
                    reviews?.map((review: any) => (
                      <div
                        key={review.id || review._id}
                        className="bg-gray-50 dark:bg-[#1a1a1a]/70 p-5 rounded-lg border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-colors"
                      >
                        <div className="flex gap-4">
                          <div className="flex-none">
                            {review.userId?.image ? (
                              <div className="w-12 h-12 relative rounded-full overflow-hidden border border-gray-200 dark:border-white/10">
                                <Image
                                  src={review.userId.image || '/user.png'}
                                  alt={review.userId.username}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center border border-gray-200 dark:border-white/10">
                                <span className="text-gray-600 dark:text-gray-300 font-bold text-lg">
                                  {review.userId?.username?.[0]?.toUpperCase() ||
                                    'U'}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white mr-2">
                                  {review.userId?.username || 'Unknown User'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    review.createdAt
                                  ).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <div className="flex items-center bg-white dark:bg-black/70 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={10}
                                    className={
                                      i < review.rating
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-gray-300 dark:text-gray-700'
                                    }
                                  />
                                ))}
                              </div>
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm leading-relaxed">
                              {review.content}
                            </p>

                            <button
                              onClick={() =>
                                handleLikeReview(review.id || review._id)
                              }
                              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors w-fit ${
                                review.isLiked
                                ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20'
                                : 'bg-white dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                              }`}
                            >
                              <Heart
                                size={14}
                                className={review.isLiked ? 'fill-current' : ''}
                              />
                              <span>Hữu ích ({review.likesCount || 0})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Info Sidebar */}
              <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm dark:shadow-lg transition-colors">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-sm border-b border-gray-100 dark:border-white/5 pb-2">
                  Thông tin chi tiết
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <span className="text-gray-500">Tình trạng</span>
                    <span
                      className={`font-semibold ${
                        book.status === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {book.status === 'completed'
                        ? 'Hoàn thành'
                        : 'Đang cập nhật'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <span className="text-gray-500">Số chương</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {book.chapters?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <span className="text-gray-500">Năm xuất bản</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {book.publishedYear}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <span className="text-gray-500">Cập nhật cuối</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(book.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Latest Chapters Sidebar */}
              <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm dark:shadow-lg transition-colors">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100 dark:border-white/5">
                  <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">
                    Chương mới
                  </h3>
                  <Link
                    href={`/books/${bookSlug}/chapters`}
                    className="text-xs text-red-600 dark:text-red-500 hover:text-red-400"
                  >
                    Xem tất cả
                  </Link>
                </div>

                <div className="space-y-2">
                  {book.chapters
                    ?.slice(-5)
                    .reverse()
                    .map((chapter: any) => (
                      <Link
                        key={chapter.id || chapter._id}
                        href={`/books/${bookSlug}/chapters/${chapter.slug}`}
                        className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/5 transition-all group"
                      >
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-1 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors line-clamp-1">
                          {chapter.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Chương {chapter.orderIndex}</span>
                          <span className="flex items-center gap-1 group-hover:text-gray-700 dark:group-hover:text-gray-400">
                            {new Date(chapter.createdAt).toLocaleDateString(
                              'vi-VN'
                            )}
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- MODAL THƯ VIỆN --- */}
        {book && (
          <AddToLibraryModal
            isOpen={isLibraryModalOpen}
            onClose={() => setIsLibraryModalOpen(false)}
            bookId={book.id}
          />
        )}

        {/* --- MODAL CHIA SẺ SÁCH --- */}
        {book && (
          <CreatePostModal
            isSubmitting={isCreatingPost}
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            onSubmit={handleSharePost}
            defaultContent={defaultShareContent}
            title={`Chia sẻ sách "${book.title}"`}
            contentLabel="Nội dung bài viết"
            contentPlaceholder="Chia sẻ suy nghĩ của bạn về cuốn sách này..."
            maxImages={10}
          />
        )}
      </div>
    </div>
  );
}
