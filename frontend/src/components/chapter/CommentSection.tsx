'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import CommentInput from './CommentInput';
import ListComments from '@/src/components/comment/ListComments';
import { usePostCreateMutation } from '@/src/features/comments/api/commentApi';
import {useTheme} from "next-themes";

export interface Comment {
  id: string;
  userId: string;
  content: string;
  likesCount: number;
  createdAt: string;
  targetType: 'book' | 'chapter';
  targetId: string;
}

interface CommentSectionProps {
  comments: Comment[];
  targetId: string;
  targetType: 'book' | 'chapter';
  emptyMessage?: string;
  className?: string;
}

export default function CommentSection({
  comments,
  targetId,
  className = '',
}: CommentSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createComment] = usePostCreateMutation();
  const { theme, setTheme } = useTheme();
  const handleSubmit = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await createComment({
        targetType: 'chapter',
        targetId,
        content: trimmed,
        parentId: null,
      }).unwrap();

      toast.success('Bình luận đã được gửi!');
    } catch (error: any) {
      console.error('Failed to submit comment:', error);
      // Display the error message from backend
      const errorMessage = error?.data?.message || 'Có lỗi xảy ra khi gửi bình luận.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`w-full pt-10 border-t border-white/5 ${className}`}>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <MessageCircle className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-neutral-200">
          Thảo luận chương ({comments.length})
        </h2>
      </div>

      <div className="mb-10 bg-neutral-900/50 p-4 rounded-xl border border-white/5">
        <CommentInput
          placeholder="Bạn nghĩ gì về chương này?..."
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>

      <div className="space-y-6">
        <ListComments
          targetId={targetId}
          isCommentOpen={true}
          parentId={null}
          targetType={'chapter'}
          theme={theme}
        />
      </div>
    </section>
  );
}
