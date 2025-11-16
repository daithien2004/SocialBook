// components/UserAvatar.tsx
interface UserAvatarProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserAvatar({
  userId,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  // Lấy chữ cái đầu tiên của userId (hoặc 'U' mặc định)
  const initial = userId.charAt(0).toUpperCase() || 'U';

  // Định nghĩa kích thước
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}
      aria-label={`Avatar người dùng ${userId}`}
    >
      {initial}
    </div>
  );
}
