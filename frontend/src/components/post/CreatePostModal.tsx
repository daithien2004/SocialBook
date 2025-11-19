'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostData) => Promise<void>;
  defaultContent?: string;
  defaultImages?: File[];
  title?: string;
  contentLabel?: string;
  contentPlaceholder?: string;
  allowEditContent?: boolean;
  allowEditImages?: boolean;
  maxImages?: number;
}

export interface CreatePostData {
  content: string;
  images: File[];
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  defaultContent = '',
  defaultImages = [],
  title = 'Tạo bài viết mới',
  contentLabel = 'Nội dung',
  contentPlaceholder = 'Chia sẻ suy nghĩ của bạn...',
  allowEditContent = true,
  allowEditImages = true,
  maxImages = 10,
}: CreatePostModalProps) {
  const [content, setContent] = useState(defaultContent);
  const [images, setImages] = useState<File[]>(defaultImages);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form khi modal mở/đóng hoặc default values thay đổi
  useEffect(() => {
    if (isOpen) {
      setContent(defaultContent);
      setImages(defaultImages);

      // Tạo preview URLs cho defaultImages
      const urls = defaultImages.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);

      // Cleanup function for this effect
      return () => {
        urls.forEach((url) => URL.revokeObjectURL(url));
      };
    } else {
      // Cleanup preview URLs khi đóng modal
      setPreviewUrls((prevUrls) => {
        prevUrls.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
    }
  }, [isOpen, defaultContent]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (filesArray.length > remainingSlots) {
      alert(
        `Chỉ có thể thêm ${remainingSlots} ảnh nữa (tối đa ${maxImages} ảnh)`
      );
      return;
    }

    // Validate file types
    const validFiles = filesArray.filter((file) => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        alert(`File ${file.name} không phải là hình ảnh`);
      }
      return isValid;
    });

    // Validate file sizes (5MB mỗi file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validSizeFiles = validFiles.filter((file) => {
      const isValid = file.size <= maxSize;
      if (!isValid) {
        alert(`File ${file.name} vượt quá 5MB`);
      }
      return isValid;
    });

    if (validSizeFiles.length > 0) {
      const newImages = [...images, ...validSizeFiles];
      setImages(newImages);

      // Tạo preview URLs
      const newPreviewUrls = validSizeFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    // Revoke URL để tránh memory leak
    URL.revokeObjectURL(previewUrls[index]);

    setImages(images.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      alert('Vui lòng nhập nội dung');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: trimmedContent,
        images,
      });
      onClose();
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Có lỗi xảy ra khi đăng bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  const canAddMore = images.length < maxImages && allowEditImages;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Đóng"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Content Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {contentLabel}
              {!allowEditContent && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Không thể chỉnh sửa)
                </span>
              )}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={contentPlaceholder}
              disabled={!allowEditContent}
              className={`w-full border text-black border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                !allowEditContent ? 'bg-gray-50 text-gray-600' : ''
              }`}
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-1">{content.length} ký tự</p>
          </div>

          {/* Images Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hình ảnh
              {!allowEditImages && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Không thể chỉnh sửa)
                </span>
              )}
            </label>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Button */}
            {allowEditImages && (
              <button
                onClick={handleClickUpload}
                disabled={!canAddMore}
                className="w-full mb-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {canAddMore
                  ? `Chọn ảnh (${images.length}/${maxImages})`
                  : `Đã đạt giới hạn ${maxImages} ảnh`}
              </button>
            )}

            {/* Images Preview */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {images[index].name}
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {(images[index].size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    {allowEditImages && (
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        aria-label="Xóa"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-gray-500">Chưa có hình ảnh nào</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click nút trên để chọn ảnh
                </p>
              </div>
            )}

            {allowEditImages && (
              <p className="text-xs text-gray-500 mt-2">
                Đã thêm {images.length}/{maxImages} hình ảnh • Tối đa 5MB/ảnh
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
          </button>
        </div>
      </div>
    </div>
  );
}
