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
            <span className="font-semibold text-foreground">
                {value}
            </span>
            <span className="text-sm text-muted-foreground">
                {label}
            </span>
        </div>
    );
}
