'use client';

import { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

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
    setContent('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid =
    content.trim().length >= minLength && content.trim().length <= maxLength;

  return (
    <div className="flex gap-3 items-center">
      <div className="relative flex-1 group">
        <input
          type="text"
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          maxLength={maxLength}
          className="w-full px-4 py-3 bg-white dark:bg-[#1a1a1a] border-2 border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed duration-300 shadow-sm"
          aria-label="Nhập bình luận"
        />

        {content.length > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 dark:text-gray-400 font-medium pointer-events-none transition-opacity">
            {content.length}/{maxLength}
          </span>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`
          flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 min-w-[80px] shadow-lg
          ${
            !isValid || isSubmitting
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-400 shadow-blue-500/30 dark:shadow-blue-400/30 active:scale-95 border-2 border-blue-700 dark:border-blue-400'
          }
        `}
        aria-label="Gửi bình luận"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span className="hidden sm:inline">Gửi</span>
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
