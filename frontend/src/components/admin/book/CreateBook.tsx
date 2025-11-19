// app/admin/books/create/CreateBookClient.tsx
'use client';

import { ChangeEvent, FormEvent, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { useCreateBookMutation } from '@/src/features/books/api/bookApi';

const DEFAULT_COVER = '/abstract-book-pattern.png';

type Status = 'draft' | 'published' | 'completed';

interface FormData {
  title: string;
  authorId: string;
  genre: string[];
  description: string;
  publishedYear: string;
  status: Status;
  tagsInput: string;
}

const initialForm: FormData = {
  title: '',
  authorId: '',
  genre: [],
  description: '',
  publishedYear: new Date().getFullYear().toString(),
  status: 'draft',
  tagsInput: '',
};

export default function CreateBookClient() {
  const router = useRouter();
  const [createBook, { isLoading }] = useCreateBookMutation();

  const [formData, setFormData] = useState<FormData>(initialForm);
  const [coverPreview, setCoverPreview] = useState<string>(DEFAULT_COVER);
  const [coverFile, setCoverFile] = useState<File | null>(null); // ✅ Lưu file thật
  const [genreInput, setGenreInput] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Lưu file gốc
    setCoverFile(file);

    // Tạo preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAddGenre = () => {
    const trimmed = genreInput.trim();
    if (!trimmed) return;
    if (formData.genre.includes(trimmed)) {
      setGenreInput('');
      return;
    }
    setFormData((prev) => ({ ...prev, genre: [...prev.genre, trimmed] }));
    setGenreInput('');
  };

  const handleRemoveGenre = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      genre: prev.genre.filter((g) => g !== id),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Tiêu đề sách là bắt buộc.' });
      return;
    }
    if (!formData.authorId.trim()) {
      setMessage({ type: 'error', text: 'Author ID là bắt buộc.' });
      return;
    }
    if (formData.genre.length === 0) {
      setMessage({ type: 'error', text: 'Vui lòng thêm ít nhất 1 thể loại.' });
      return;
    }

    try {
      const tags = formData.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // ✅ Tạo FormData để gửi file
      const formPayload = new FormData();

      formPayload.append('title', formData.title.trim());
      formPayload.append('authorId', formData.authorId.trim());
      formPayload.append('description', formData.description.trim());
      formPayload.append('status', formData.status);

      if (formData.publishedYear) {
        formPayload.append('publishedYear', formData.publishedYear);
      }

      // Append genre array
      formData.genre.forEach((genreId) => {
        formPayload.append('genre[]', genreId);
      });

      // Append tags array
      if (tags.length > 0) {
        tags.forEach((tag) => {
          formPayload.append('tags[]', tag);
        });
      }

      // ✅ Append cover file nếu có
      if (coverFile) {
        formPayload.append('coverUrl', coverFile);
      }

      await createBook(formPayload).unwrap();

      setMessage({
        type: 'success',
        text: 'Tạo sách thành công! Đang chuyển về danh sách...',
      });
      setFormData(initialForm);
      setCoverPreview(DEFAULT_COVER);
      setCoverFile(null); // ✅ Reset file
      setGenreInput('');

      setTimeout(() => router.push('/admin/books'), 2000);
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        'Không thể tạo sách. Vui lòng kiểm tra lại thông tin.';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/books')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Quay lại danh sách sách
          </button>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Thêm sách mới
          </h1>
          <p className="text-lg text-gray-600">
            Điền đầy đủ thông tin để xuất bản sách trên SocialBook
          </p>
        </div>

        {/* Server Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border shadow-sm ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Main Content Section */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Book Cover Section */}
              <div className="flex-none">
                <div className="w-64 h-96 relative rounded-lg overflow-hidden shadow-lg border-2 border-gray-200 group">
                  <img
                    src={coverPreview}
                    alt="Bìa sách"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-center text-white">
                      <Upload size={32} className="mx-auto mb-2" />
                      <p className="text-sm font-medium">Thay đổi ảnh bìa</p>
                    </div>
                  </div>
                </div>

                <label className="block mt-4">
                  <div className="flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Upload size={20} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Tải ảnh bìa lên
                    </span>
                    <span className="text-xs text-gray-500">
                      JPG, PNG, WebP • &lt; 5MB
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {/* ✅ Hiển thị tên file đã chọn */}
                {coverFile && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium truncate">
                      📎 {coverFile.name}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {(coverFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
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

                {/* Author ID and Published Year */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Author ID *
                    </label>
                    <input
                      type="text"
                      value={formData.authorId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          authorId: e.target.value,
                        }))
                      }
                      placeholder="Ví dụ: 671a3f..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                      required
                    />
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
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as Status,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="published">Đang xuất bản</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
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

                {/* Genre Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Thể loại (Genre ID) *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), handleAddGenre())
                      }
                      placeholder="Nhập ObjectId thể loại..."
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={handleAddGenre}
                      className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
                    >
                      <Plus size={18} />
                      Thêm
                    </button>
                  </div>

                  {formData.genre.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {formData.genre.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {id}
                          <button
                            type="button"
                            onClick={() => handleRemoveGenre(id)}
                            className="hover:text-blue-900 transition"
                          >
                            <X size={14} />
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
                      {formData.genre.length} thể loại
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
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
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
                    onClick={() => {
                      setFormData(initialForm);
                      setCoverPreview(DEFAULT_COVER);
                      setCoverFile(null); // ✅ Reset file
                      setGenreInput('');
                      setMessage(null);
                    }}
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
