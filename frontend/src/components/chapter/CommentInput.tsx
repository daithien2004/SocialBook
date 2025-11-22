// components/CommentInput.tsx
'use client';

import { useState, KeyboardEvent } from 'react';

interface CommentInputProps {
  placeholder?: string;
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
  maxLength?: number;
  minLength?: number;
}

export default function CommentInput({
  placeholder = 'Viết bình luận của bạn...',
  onSubmit,
  isSubmitting = false,
  maxLength = 500,
  minLength = 1,
}: CommentInputProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    const trimmed = content.trim();

    if (trimmed.length < minLength) return;
    if (trimmed.length > maxLength) return;

    onSubmit(trimmed);
    setContent(''); // Clear input sau khi gửi
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Gửi bình luận khi nhấn Enter (không phải Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid =
    content.trim().length >= minLength && content.trim().length <= maxLength;

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        maxLength={maxLength}
        className="flex-1 px-4 py-2.5 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-label="Nhập bình luận"
      />
      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        aria-label="Gửi bình luận"
      >
        {isSubmitting ? 'Đang gửi...' : 'Gửi'}
      </button>
    </div>
  );
}
