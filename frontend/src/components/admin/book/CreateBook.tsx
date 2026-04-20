'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  Plus,
  X,
  Loader2,
  BookOpen,
  Calendar,
  Tag,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useCreateBookMutation } from '@/features/books/api/bookApi';
import { useGetAuthorsQuery, useGetGenresQuery } from '@/features/admin/api/bookRelationApi';
import { AuthorOption, GenreOption } from '@/features/admin/types/bookRelation.interface';
import { useCreateBookForm, BookStatus } from '@/features/admin/hooks/books/useCreateBookForm';

type Status = BookStatus;

const EMPTY_AUTHORS: AuthorOption[] = [];
const EMPTY_GENRES: GenreOption[] = [];

export default function CreateBook() {
  const router = useRouter();
  const [createBook, { isLoading }] = useCreateBookMutation();
  const { data: authors = EMPTY_AUTHORS, isLoading: loadingAuthors } = useGetAuthorsQuery();
  const { data: genres = EMPTY_GENRES, isLoading: loadingGenres } = useGetGenresQuery();
  
  const {
    formData,
    coverPreview,
    coverFile,
    selectedGenreId,
    setSelectedGenreId,
    message,
    isSubmitting,
    setFormData,
    handleImageUpload,
    handleAddGenre,
    handleRemoveGenre,
    handleReset,
    handleSubmit,
  } = useCreateBookForm((payload) => createBook(payload).unwrap());

  const getGenreName = (genreId: string) => {
    const genre = genres.find((g: any) => (g.id ?? g._id) === genreId);
    return genre?.name || genreId;
  };

  const getAuthorName = (authorId: string) => {
    const author = authors.find((a: any) => (a.id ?? a._id) === authorId);
    return author?.name || 'Chưa chọn';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/books')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={14} />
            Quay lại danh sách
          </button>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Thêm sách mới
          </h1>
          <p className="text-slate-500 font-medium">
            Điền đầy đủ thông tin để xuất bản sách trên hệ thống SocialBook
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border shadow-sm ${message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
              }`}
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Book Cover Section */}
              <div className="flex-none">
                <div className="w-56 h-80 relative rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                  <Image
                    src={coverPreview}
                    alt="Bìa sách"
                    fill
                    unoptimized
                    sizes="224px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-center text-white">
                      <Upload size={24} className="mx-auto mb-2" />
                      <p className="text-xs font-bold uppercase tracking-wide">Thay đổi bìa</p>
                    </div>
                  </div>
                </div>

                <label className="block mt-4">
                  <div className="flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 uppercase">Tải ảnh bìa</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Book Info Form */}
              <div className="flex-1 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <BookOpen className="inline w-4 h-4 mr-1" />
                    Tiêu đề sách *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Nhập tiêu đề sách..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    required
                  />
                </div>

                {/* Author Dropdown and Published Year */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Tác giả *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.authorId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            authorId: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition appearance-none bg-white"
                        required
                        disabled={loadingAuthors}
                      >
                        <option value="">
                          {loadingAuthors ? 'Đang tải...' : 'Chọn tác giả'}
                        </option>
                        {authors.map((author: any, idx: number) => {
                          const authorId = author.id ?? author._id;
                          return (
                            <option key={authorId ?? `author-${idx}`} value={authorId}>
                              {author.name}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown
                        size={20}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Năm xuất bản
                    </label>
                    <input
                      type="text"
                      value={formData.publishedYear}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          publishedYear: e.target.value,
                        }))
                      }
                      placeholder={new Date().getFullYear().toString()}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <FileText className="inline w-4 h-4 mr-1" />
                    Mô tả sách
                  </label>
                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Giới thiệu ngắn gọn về nội dung sách..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none transition"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Trạng thái
                  </label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as BookStatus,
                        }))
                      }
                      className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition appearance-none bg-white"
                    >
                      <option value="draft">Bản nháp</option>
                      <option value="published">Đang xuất bản</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
                    <ChevronDown
                      size={20}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Genres Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Thể loại & Tags
                </h2>

                {/* Genre Dropdown */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Thể loại *
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <select
                        value={selectedGenreId}
                        onChange={(e) => setSelectedGenreId(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition appearance-none bg-white"
                        disabled={loadingGenres}
                      >
                        <option value="">
                          {loadingGenres ? 'Đang tải...' : 'Chọn thể loại'}
                        </option>
                        {genres.map((genre: any, idx: number) => {
                          const genreId = genre.id ?? genre._id;
                          return (
                            <option
                              key={genreId ?? `genre-${idx}`}
                              value={genreId}
                              disabled={formData.genres.includes(genreId)}
                            >
                              {genre.name}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown
                        size={20}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddGenre}
                      disabled={!selectedGenreId}
                      className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={18} />
                      Thêm
                    </button>
                  </div>

                  {formData.genres.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {formData.genres.map((genreId) => (
                        <span
                          key={genreId}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {getGenreName(genreId)}
                          <button
                            type="button"
                            onClick={() => handleRemoveGenre(genreId)}
                            className="hover:text-blue-900 transition"
                          >
                            <X size={16} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <Tag className="inline w-4 h-4 mr-1" />
                    Tags (ngăn cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={formData.tagsInput}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tagsInput: e.target.value,
                      }))
                    }
                    placeholder="fantasy, romance, adventure..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Nhập các tag cách nhau bằng dấu phẩy để dễ tìm kiếm
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Tóm tắt</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tác giả:</span>
                    <span className="font-semibold text-gray-900 text-right ml-2 truncate max-w-[150px]">
                      {getAuthorName(formData.authorId)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.status === 'draft' && 'Bản nháp'}
                      {formData.status === 'published' && 'Đang xuất bản'}
                      {formData.status === 'completed' && 'Hoàn thành'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thể loại:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.genres.length} thể loại
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tags:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.tagsInput
                        ? formData.tagsInput.split(',').length
                        : 0}{' '}
                      tags
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Năm xuất bản:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.publishedYear || 'Chưa có'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Đang tạo sách...
                      </>
                    ) : (
                      <>
                        <BookOpen size={20} />
                        Tạo sách mới
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Đặt lại form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
