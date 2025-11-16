// components/CommentSection.tsx
'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

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
  onSubmitComment?: (content: string) => Promise<void>;
  onLikeComment?: (commentId: string) => void;
  onReplyComment?: (commentId: string) => void;
  emptyMessage?: string;
  className?: string;
}

export default function CommentSection({
  comments,
  targetId,
  targetType,
  onSubmitComment,
  onLikeComment,
  onReplyComment,
  emptyMessage = 'Chưa có bình luận. Hãy là người đầu tiên!',
  className = '',
}: CommentSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (content: string) => {
    if (!onSubmitComment) return;

    setIsSubmitting(true);
    try {
      await onSubmitComment(content);
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
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={onLikeComment}
              onReply={onReplyComment}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">{emptyMessage}</p>
        )}
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
