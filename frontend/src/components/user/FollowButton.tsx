'use client';

import { Button } from '@/components/ui/button';
import { UserCheck, UserPlus, Loader2 } from 'lucide-react';
import { useFollowUser } from './hooks';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
    userId: string;
    initialIsFollowing?: boolean;
    size?: 'sm' | 'default' | 'lg';
    variant?: 'default' | 'outline' | 'ghost';
    className?: string;
    onFollowChange?: (isFollowing: boolean) => void;
}

const sizeClasses = {
    sm: 'h-8 text-xs px-3',
    default: 'h-9 text-sm px-4',
    lg: 'h-10 text-base px-5',
};

const iconSizeClasses = {
    sm: 'h-3.5 w-3.5',
    default: 'h-4 w-4',
    lg: 'h-4 w-4',
};

export function FollowButton({
    userId,
    initialIsFollowing = false,
    size = 'default',
    variant = 'outline',
    className,
    onFollowChange,
}: FollowButtonProps) {
    const { isFollowing, isLoading, toggleFollow } = useFollowUser({
        userId,
        initialIsFollowing,
        onFollowChange,
    });

    const isPrimary = isFollowing;

    return (
        <Button
            variant={isPrimary ? 'default' : variant}
            size={size}
            disabled={isLoading}
            onClick={toggleFollow}
            className={cn(
                'gap-1.5 font-medium tracking-wide transition-all',
                sizeClasses[size],
                isPrimary && 'bg-primary text-primary-foreground hover:bg-primary/90',
                !isPrimary && variant === 'ghost' && 'hover:bg-accent',
                className
            )}
        >
            {isLoading ? (
                <Loader2 className={cn(iconSizeClasses[size], 'animate-spin')} />
            ) : isFollowing ? (
                <>
                    <UserCheck className={iconSizeClasses[size]} />
                    <span>Đang theo dõi</span>
                </>
            ) : (
                <>
                    <UserPlus className={iconSizeClasses[size]} />
                    <span>Theo dõi</span>
                </>
            )}
        </Button>
    );
}

interface FollowButtonCompactProps extends Omit<FollowButtonProps, 'variant'> {}

export function FollowButtonCompact({
    userId,
    initialIsFollowing,
    size = 'sm',
    className,
    onFollowChange,
}: FollowButtonCompactProps) {
    const { isFollowing, isLoading, toggleFollow } = useFollowUser({
        userId,
        initialIsFollowing,
        onFollowChange,
    });

    return (
        <Button
            variant="ghost"
            size="icon"
            disabled={isLoading}
            onClick={toggleFollow}
            className={cn(
                'h-8 w-8 rounded-full',
                isFollowing && 'text-primary',
                className
            )}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
                <UserCheck className="h-4 w-4" />
            ) : (
                <UserPlus className="h-4 w-4" />
            )}
        </Button>
    );
}
