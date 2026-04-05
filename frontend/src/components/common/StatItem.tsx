'use client';

import { cn } from '@/lib/utils';

interface StatItemProps {
    label: string;
    value: string | number;
    className?: string;
}

export function StatItem({ label, value, className }: StatItemProps) {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <span className="font-semibold text-slate-900 dark:text-gray-100">
                {value}
            </span>
            <span className="text-sm text-slate-600 dark:text-gray-400">
                {label}
            </span>
        </div>
    );
}
