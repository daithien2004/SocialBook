'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useCreatePostMutation } from '@/features/posts/api/postApi';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import BookSelector from './BookSelector';
import { useAppAuth } from '@/hooks/useAppAuth';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

interface CreatePostFormProps {
  onClose: () => void;
}

export default function CreatePostForm({ onClose }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [bookId, setBookId] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAppAuth();

  const [createPost, { isLoading }] = useCreatePostMutation();

  useEffect(() => {
    return () => {
      imagePreviews.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, [imagePreviews]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast.info('Chỉ được tải lên tối đa 10 ảnh');
      return;
    }

    const previewUrls = files.map((file) => URL.createObjectURL(file));

    setImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...previewUrls]);
  };

  const removeImage = (index: number) => {
    const previewToRemove = imagePreviews[index];
    if (previewToRemove) {
      URL.revokeObjectURL(previewToRemove);
    }

    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.info('Vui lòng nhập nội dung bài viết');
      return;
    }

    if (!bookId.trim()) {
      toast.info('Vui lòng chọn sách');
      return;
    }

    try {
      const result = await createPost({
        bookId,
        content,
        images,
      }).unwrap();

      if (result.warning) {
        toast.warning('Bài viết đang được xem xét', {
          description: result.warning,
          duration: 5000, // Show longer for user to read
        });
      } else {
        toast.success('Đăng bài viết thành công! 🎉');
      }
      onClose();
    } catch (error: any) {
      console.log('Failed to create post:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const currentUserName = user?.name || 'Người đọc';
  const currentUserImage =
    (user as any)?.image || '/abstract-book-pattern.png';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay mờ, không đen đặc */}
      <div className="absolute inset-0 bg-slate-900/15 dark:bg-slate-900/40 backdrop-blur-[2px]" />

      {/* MODAL: flex-col + max-h + KHÔNG overflow-hidden */}
      <div
        className="relative bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl w-full max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-gray-700">
        {/* Header (không scroll) */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b rounded-3xl border-slate-100 dark:border-gray-800 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur sticky top-0 z-10">
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-gray-100">
            Tạo bài viết
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
          </button>
        </div>

        {/* BODY: phần này mới được scroll */}
        <div className="flex-1 overflow-y-auto thin-scrollbar">
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* User info */}
            <div className="flex items-center gap-3">
              <Image
                src={currentUserImage}
                alt={currentUserName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-gray-700"
              />
              <div className="space-y-0.5">
                <p className="font-semibold text-sm text-slate-900 dark:text-gray-100">
                  {currentUserName}
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Chia sẻ công khai
                </p>
              </div>
            </div>

            {/* Content */}
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về một cuốn sách, một trích dẫn, hay một khoảnh khắc đọc thú vị..."
                className="w-full rounded-2xl bg-slate-50 dark:bg-gray-900/40 border border-slate-200 dark:border-gray-700 px-3.5 py-3 text-sm text-slate-800 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none min-h-[140px]"
                rows={6}
                disabled={isLoading}
              />
            </div>

            {/* Book Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200">
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
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/40"
                  >
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      width={160}
                      height={128}
                      unoptimized
                      className="h-28 w-full object-cover md:h-32"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/70 dark:bg-black/70 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                      disabled={isLoading}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div
              className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                disabled={isLoading || images.length >= 10}
              >
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <span className="whitespace-nowrap">
                  Thêm ảnh ({images.length}/10)
                </span>
              </button>

              <button
                type="submit"
                disabled={isLoading || !content.trim() || !bookId.trim()}
                className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
    </div>
  );
}
