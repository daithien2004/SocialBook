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
          className="w-full px-4 py-3 bg-neutral-900/50 border border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-900 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Nhập bình luận"
        />

        {content.length > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-600 font-mono pointer-events-none transition-opacity">
            {content.length}/{maxLength}
          </span>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`
          flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 min-w-[80px]
          ${
            !isValid || isSubmitting
              ? 'bg-white/5 text-neutral-600 cursor-not-allowed border border-transparent'
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 active:scale-95 border border-blue-500/50' // Active state
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
