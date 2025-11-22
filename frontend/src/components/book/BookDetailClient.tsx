'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGetBookBySlugQuery } from '@/src/features/books/api/bookApi';
import {
  useGetReviewsByBookQuery,
  useCreateReviewMutation,
} from '@/src/features/reviews/api/reviewApi';

// --- IMPORT MODAL THƯ VIỆN ---
import AddToLibraryModal from '@/src/components/library/AddToLibraryModal';

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
} from 'lucide-react';

interface BookDetailClientProps {
  bookSlug: string;
}

export default function BookDetailClient({ bookSlug }: BookDetailClientProps) {
  // 1. State cho Form Review & Modal Thư viện
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false); // <--- STATE MỚI

  const [ratingInput, setRatingInput] = useState(5);
  const [contentInput, setContentInput] = useState('');

  // 2. Fetch Book Detail
  const {
    data: book,
    isLoading: isLoadingBook,
    error,
  } = useGetBookBySlugQuery({ bookSlug });

  // 3. Fetch Reviews
  const { data: reviews, isLoading: isLoadingReviews } =
    useGetReviewsByBookQuery(book?.id as string, { skip: !book?.id });

  // 4. Mutation tạo Review
  const [createReview, { isLoading: isCreating }] = useCreateReviewMutation();

  // Handle Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book?.id) return;

    if (!contentInput.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
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
      alert('Đánh giá thành công!');
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Có lỗi xảy ra khi gửi đánh giá.');
    }
  };

  // Loading Skeleton
  if (isLoadingBook) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="flex gap-8 mb-8">
              <div className="w-64 h-96 bg-gray-300 rounded-lg"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-300 rounded w-2/3"></div>
                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Không tìm thấy sách
          </h1>
          <p className="text-gray-600">
            Sách bạn tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
        </div>
      </div>
    );
  }

  // Data hiển thị
  const displayRating = book.averageRating || 0;
  // Nếu API book chưa trả về totalRatings chính xác, fallback sang độ dài mảng review
  const displayTotalRatings = book.totalRatings || reviews?.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Book Cover */}
            <div className="flex-none">
              <div className="w-64 h-96 relative rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {book.title}
              </h1>

              <p className="text-lg text-gray-600 mb-4">
                Tác giả:{' '}
                <span className="font-semibold text-gray-900">
                  {book.authorId.name}
                </span>
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  <span>{book.views?.toLocaleString()} lượt xem</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={16} />
                  <span>{book.likes?.toLocaleString()} yêu thích</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen size={16} />
                  <span>{book.chapters?.length || 0} chương</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>Xuất bản: {book.publishedYear}</span>
                </div>
              </div>

              {/* Genres & Status */}
              <div className="flex flex-wrap gap-2 mb-6">
                {book.genres?.map((genre: any) => (
                  <span
                    key={genre._id || genre.id}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {genre.name}
                  </span>
                ))}
                {book.status === 'completed' && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    Hoàn thành
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-700 leading-relaxed mb-6">
                {book.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {/* Nút Đọc Ngay */}
                {book.chapters?.length > 0 && (
                  <Link
                    href={`/books/${bookSlug}/chapters/${book.chapters[0].slug}`}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <BookOpen size={20} />
                    Đọc ngay
                  </Link>
                )}

                {/* Nút Thêm vào Thư Viện (Sửa từ nút Bookmark cũ) */}
                <button
                  onClick={() => setIsLibraryModalOpen(true)}
                  className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Bookmark size={20} />
                  Thêm vào thư viện
                </button>

                {/* Nút Yêu thích (Like) */}
                <button
                  className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-lg transition-colors"
                  title="Yêu thích"
                >
                  <Heart size={20} />
                </button>

                {/* Nút Share */}
                <button
                  className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-lg transition-colors"
                  title="Chia sẻ"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">
                {displayRating}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {displayTotalRatings} đánh giá
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {book.views?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Lượt xem</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {book.likes?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Yêu thích</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <BookOpen className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {book.chapters?.length || 0}
            </p>
            <p className="text-sm text-gray-600">Chương</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Detail */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Mô tả chi tiết
              </h2>
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-4">{book.description}</p>
                <p>
                  Cuốn sách "{book.title}" của tác giả {book.authorId.name} mang
                  đến một câu chuyện đầy cảm xúc và ý nghĩa. Đây là một trong
                  những tác phẩm tiêu biểu thuộc thể loại{' '}
                  {book.genres?.map((g: any) => g.name).join(', ')}.
                </p>
              </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Đánh giá ({reviews?.length})
                </h2>
                {!isReviewFormOpen && (
                  <button
                    onClick={() => setIsReviewFormOpen(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    <MessageCircle size={18} />
                    Viết đánh giá
                  </button>
                )}
              </div>

              {/* FORM VIẾT REVIEW */}
              {isReviewFormOpen && (
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">
                      Viết đánh giá của bạn
                    </h3>
                    <button
                      onClick={() => setIsReviewFormOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitReview}>
                    <div className="mb-4">
                      <label className="block text-sm text-gray-600 mb-2">
                        Chấm điểm:
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
                              size={24}
                              className={`${
                                star <= ratingInput
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm text-gray-600 mb-2">
                        Nội dung:
                      </label>
                      <textarea
                        value={contentInput}
                        onChange={(e) => setContentInput(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        rows={4}
                        placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsReviewFormOpen(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
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
                  <div className="text-center py-8 text-gray-500">
                    Đang tải đánh giá...
                  </div>
                ) : reviews?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 italic">
                    Chưa có đánh giá nào. Hãy là người đầu tiên!
                  </div>
                ) : (
                  reviews?.map((review: any) => (
                    <div
                      key={review.id || review._id}
                      className="border-b border-gray-100 pb-6 last:border-0"
                    >
                      <div className="flex gap-3">
                        <div className="flex-none">
                          {review.userId?.image ? (
                            <div className="w-10 h-10 relative rounded-full overflow-hidden">
                              <Image
                                src={review.userId.image}
                                alt={review.userId.username}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-semibold text-sm">
                                {review.userId?.username?.[0]?.toUpperCase() ||
                                  'U'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {review.userId?.username || 'Unknown User'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(
                                'vi-VN'
                              )}
                            </span>
                            <div className="flex items-center ml-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={
                                    i < review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-2">{review.content}</p>
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
                            <Heart size={14} />
                            <span>{review.likesCount || 0}</span>
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
          <div className="space-y-6">
            {/* Book Info Sidebar */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Thông tin</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="font-semibold text-gray-900">
                    {book.status === 'completed'
                      ? 'Hoàn thành'
                      : 'Đang cập nhật'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số chương:</span>
                  <span className="font-semibold text-gray-900">
                    {book.chapters?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Xuất bản:</span>
                  <span className="font-semibold text-gray-900">
                    {book.publishedYear}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cập nhật:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(book.updatedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {book.tags?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Chapters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Chương mới nhất</h3>
              <div className="space-y-3">
                {book.chapters
                  ?.slice(-5)
                  .reverse()
                  .map((chapter: any) => (
                    <Link
                      key={chapter.id || chapter._id}
                      href={`/books/${bookSlug}/chapters/${chapter.slug}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-1 group-hover:text-blue-600">
                        {chapter.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Chương {chapter.orderIndex}</span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {chapter.viewsCount}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RENDER MODAL THƯ VIỆN --- */}
      {book && (
        <AddToLibraryModal
          isOpen={isLibraryModalOpen}
          onClose={() => setIsLibraryModalOpen(false)}
          bookId={book.id}
          // Nếu muốn modal hiển thị trạng thái hiện tại của sách,
          // bạn cần API getBook trả về `userLibraryStatus` và `userCollectionIds`.
          // Hiện tại để mặc định, Modal sẽ tự lo logic tick/untick khi user thao tác.
        />
      )}
    </div>
  );
}
