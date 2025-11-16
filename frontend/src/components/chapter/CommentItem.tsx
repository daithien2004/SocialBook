// components/CommentItem.tsx
'use client';

import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import UserAvatar from './UserAvatar';

interface Comment {
  id: string;
  userId: string;
  content: string;
  likesCount: number;
  createdAt: string;
}

interface CommentItemProps {
  comment: Comment;
  onLike?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
}

export default function CommentItem({
  comment,
  onLike,
  onReply,
}: CommentItemProps) {
  const handleLike = () => {
    if (onLike) onLike(comment.id);
  };

  const handleReply = () => {
    if (onReply) onReply(comment.id);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
      <div className="flex gap-3">
        <UserAvatar userId={comment.userId} size="md" />

        <div className="flex-1">
          {/* Tên người dùng */}
          <p className="font-medium text-gray-900">
            User{comment.userId.slice(-6)}
          </p>

          {/* Nội dung bình luận */}
          <p className="mt-1 text-gray-700">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            {/* Like button */}
            <button
              onClick={handleLike}
              className="flex items-center gap-1 hover:text-red-600 transition"
              aria-label="Thích bình luận"
            >
              <Heart className="w-4 h-4" />
              {comment.likesCount}
            </button>

            {/* Reply button */}
            <button
              onClick={handleReply}
              className="flex items-center gap-1 hover:text-blue-600 transition"
              aria-label="Trả lời bình luận"
            >
              <MessageCircle className="w-4 h-4" />
              Trả lời
            </button>

            {/* Timestamp */}
            <span>
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: vi,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
