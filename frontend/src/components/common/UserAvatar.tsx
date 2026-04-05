'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface UserAvatarProps {
    src?: string | null;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showOnlineStatus?: boolean;
    isOnline?: boolean;
    className?: string;
    fallbackClassName?: string;
    onClick?: () => void;
}

const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-14 w-14 text-lg',
};

const onlineDotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
};

export function UserAvatar({
    src,
    name,
    size = 'md',
    showOnlineStatus = false,
    isOnline = false,
    className,
    fallbackClassName,
    onClick,
}: UserAvatarProps) {
    const initial = name?.charAt(0)?.toUpperCase() || 'U';

    const avatarContent = (
        <div className={cn('relative inline-block', onClick && 'cursor-pointer')} onClick={onClick}>
            <Avatar className={cn(sizeClasses[size], className)}>
                <AvatarImage
                    src={src || '/abstract-book-pattern.png'}
                    alt={name || 'User'}
                    className="object-cover"
                />
                <AvatarFallback className={cn('bg-primary/10 text-primary font-medium', fallbackClassName)}>
                    {initial}
                </AvatarFallback>
            </Avatar>
            {showOnlineStatus && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 rounded-full ring-2 ring-background',
                        onlineDotSizes[size],
                        isOnline ? 'bg-success' : 'bg-gray-400'
                    )}
                />
            )}
        </div>
    );

    return avatarContent;
}

interface UserAvatarWithInfoProps extends UserAvatarProps {
    displayName?: string;
    subtitle?: string;
    subtitleClassName?: string;
    infoClassName?: string;
}

export function UserAvatarWithInfo({
    displayName,
    subtitle,
    subtitleClassName,
    infoClassName,
    ...avatarProps
}: UserAvatarWithInfoProps) {
    return (
        <div className={cn('flex items-center gap-3', avatarProps.onClick && 'cursor-pointer')} onClick={avatarProps.onClick}>
            <UserAvatar {...avatarProps} />
            <div className={cn('space-y-0.5', infoClassName)}>
                {displayName && (
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                        {displayName}
                    </h2>
                )}
                {subtitle && (
                    <p className={cn('text-xs text-slate-500 dark:text-gray-400', subtitleClassName)}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
