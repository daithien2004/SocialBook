'use client';

import { useState, useRef } from 'react';
import { useCreatePostMutation } from '@/src/features/posts/api/postApi';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import BookSelector from './BookSelector';
import { useSession } from 'next-auth/react';

interface CreatePostFormProps {
  onClose: () => void;
}

export default function CreatePostForm({ onClose }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [bookId, setBookId] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: session, status } = useSession();
  const user = session?.user;

  const [createPost, { isLoading }] = useCreatePostMutation();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      alert('Chỉ được tải lên tối đa 10 ảnh');
      return;
    }

    setImages((prev) => [...prev, ...files]);

    // Tạo preview
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Vui lòng nhập nội dung bài viết');
      return;
    }

    if (!bookId.trim()) {
      alert('Vui lòng chọn sách');
      return;
    }

    try {
      await createPost({
        userId: user?.id,
        bookId,
        content,
        images,
      }).unwrap();

      alert('Đăng bài viết thành công! 🎉');
      onClose();
    } catch (error: any) {
      console.error('Failed to create post:', error);
      alert(error?.data?.message || 'Lỗi khi đăng bài viết');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Tạo bài viết</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* User info */}
          <div className="flex items-center space-x-3">
            <img
              src="/abstract-book-pattern.png"
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">Vinh</p>
              <p className="text-xs text-gray-500">Công khai</p>
            </div>
          </div>

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn về một cuốn sách..."
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={6}
            disabled={isLoading}
          />

          {/* Book Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn sách <span className="text-red-500">*</span>
            </label>
            <BookSelector
              value={bookId}
              onChange={(id) => setBookId(id)}
              disabled={isLoading}
              placeholder="Chọn một cuốn sách bạn đang đọc..."
            />
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition"
              disabled={isLoading || images.length >= 10}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm">Thêm ảnh ({images.length}/10)</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !content.trim() || !bookId.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Đang đăng...' : 'Đăng bài'}</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </form>
      </div>
    </div>
  );
}
