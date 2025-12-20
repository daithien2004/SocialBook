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
    <div className="relative group w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        maxLength={maxLength}
        className="w-full pl-5 pr-32 py-4 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:bg-white dark:focus:bg-[#1a1a1a] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all shadow-sm"
        aria-label="Nhập bình luận"
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {content.length > 0 && (
          <span className="text-xs text-gray-400 font-medium px-2 hidden sm:block">
            {content.length}/{maxLength}
          </span>
        )}
        
        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`
            flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
            ${
              !isValid || isSubmitting
                ? 'bg-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95'
            }
          `}
          aria-label="Gửi bình luận"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
