'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    color?: 'primary' | 'muted' | 'white';
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
};

const colorClasses = {
    primary: 'text-primary',
    muted: 'text-muted-foreground',
    white: 'text-white',
};

export function LoadingSpinner({
    size = 'md',
    className,
    color = 'primary',
}: LoadingSpinnerProps) {
    return (
        <Loader2
            role="status"
            aria-label="Loading"
            className={cn(
                'animate-spin',
                sizeClasses[size],
                colorClasses[color],
                className
            )}
        />
    );
}

interface LoadingOverlayProps {
    className?: string;
    children?: React.ReactNode;
}

export function LoadingOverlay({ className, children }: LoadingOverlayProps) {
    return (
        <div className={cn(
            'flex items-center justify-center py-10',
            className
        )}>
            <LoadingSpinner size="lg" />
            {children && (
                <div className="ml-4 text-muted-foreground">{children}</div>
            )}
        </div>
    );
}

interface LoadingCardProps {
    lines?: number;
    className?: string;
}

export function LoadingCard({ lines = 3, className }: LoadingCardProps) {
    return (
        <div className={cn('space-y-3 p-4', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
            ))}
        </div>
    );
}
