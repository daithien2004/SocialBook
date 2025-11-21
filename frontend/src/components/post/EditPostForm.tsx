'use client';

import { useState, useRef } from 'react';
import { Post } from '@/src/features/posts/types/post.interface';
import { useUpdatePostMutation } from '@/src/features/posts/api/postApi';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import BookSelector from './BookSelector';

interface EditPostFormProps {
  post: Post;
  onClose: () => void;
}

export default function EditPostForm({ post, onClose }: EditPostFormProps) {
  const [content, setContent] = useState(post.content);
  const [bookId, setBookId] = useState(post.bookId?.id || '');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updatePost, { isLoading }] = useUpdatePostMutation();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages =
      (post.imageUrls?.length || 0) + newImages.length + files.length;

    if (totalImages > 10) {
      alert('Tổng số ảnh không được vượt quá 10');
      return;
    }

    setNewImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Vui lòng nhập nội dung bài viết');
      return;
    }

    try {
      await updatePost({
        id: post.id,
        data: {
          content,
          bookId: bookId || undefined,
          images: newImages.length > 0 ? newImages : undefined,
        },
      }).unwrap();

      alert('Cập nhật bài viết thành công! 🎉');
      onClose();
    } catch (error: any) {
      console.error('Failed to update post:', error);
      alert(error?.data?.message || 'Lỗi khi cập nhật bài viết');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Chỉnh sửa bài viết</h2>
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
              src={post.userId?.image || '/abstract-book-pattern.png'}
              alt={post.userId?.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{post.userId?.username}</p>
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
              Chọn sách
            </label>
            <BookSelector
              value={bookId}
              onChange={(id) => setBookId(id)}
              disabled={isLoading}
            />
          </div>

          {/* Existing Images */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Ảnh hiện tại ({post.imageUrls.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {post.imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Đã có
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Để xóa ảnh cũ, vui lòng click nút X trên ảnh ở PostCard
              </p>
            </div>
          )}

          {/* New Image Previews */}
          {newImagePreviews.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Ảnh mới ({newImagePreviews.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {newImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition"
              disabled={isLoading}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm">Thêm ảnh mới</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
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
