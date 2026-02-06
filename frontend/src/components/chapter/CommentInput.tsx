'use client';

import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { KeyboardEvent, useState } from 'react';

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid =
    content.trim().length >= minLength && content.trim().length <= maxLength;

  return (
    <div className="relative group w-full">
      <Textarea
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        maxLength={maxLength}
        className="w-full pl-5 pr-32 py-4 min-h-[60px] resize-none rounded-2xl bg-muted/50 focus:bg-background transition-all shadow-sm"
        aria-label="Nhập bình luận"
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {content.length > 0 && (
          <span className="text-xs text-muted-foreground font-medium px-2 hidden sm:block">
            {content.length}/{maxLength}
          </span>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          size="icon"
          className="rounded-xl h-10 w-10 shadow-lg"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
