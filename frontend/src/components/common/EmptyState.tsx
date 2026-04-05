'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
    iconClassName?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
    iconClassName,
}: EmptyStateProps) {
    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-10 space-y-2 text-center',
            className
        )}>
            {Icon && (
                <Icon className={cn(
                    'w-12 h-12 mb-4 text-muted-foreground/50',
                    iconClassName
                )} />
            )}
            <p className="text-sm font-medium text-slate-800 dark:text-gray-200">
                {title}
            </p>
            {description && (
                <p className="text-xs text-slate-500 dark:text-gray-400">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
