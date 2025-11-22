// components/CommentSection.tsx
'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import CommentInput from './CommentInput';
import ListComments from '@/src/components/comment/ListComments';
import { usePostCreateMutation } from '@/src/features/comments/api/commentApi';

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

  const handleSubmit = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      // Ưu tiên gọi API tạo comment như ModalPostComment
      await createComment({
        targetType: 'chapter', // 🔴 logic chapter
        targetId,
        content: trimmed,
        parentId: null,
      }).unwrap();
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className={`max-w-3xl mx-auto w-full p-6 bg-white border-t border-gray-200 rounded-b ${className}`}
    >
      {/* Header */}
      <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        Bình luận ({comments.length})
      </h2>

      {/* Danh sách bình luận */}
      <div className="space-y-4">
        <ListComments
          targetId={targetId}
          isCommentOpen={true}
          parentId={null}
          targetType={'chapter'}
        />
      </div>

      {/* Form nhập bình luận */}
      <div className="mt-6">
        <CommentInput
          placeholder="Viết bình luận của bạn..."
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </section>
  );
}
