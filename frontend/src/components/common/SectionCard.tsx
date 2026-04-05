'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface SectionCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

export function SectionCard({ children, className, title, action }: SectionCardProps) {
    return (
        <Card className={cn('p-5', className)}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-4">
                    {title && (
                        <h3 className="text-sm text-slate-600 dark:text-gray-400">
                            {title}
                        </h3>
                    )}
                    {action}
                </div>
            )}
            {children}
        </Card>
    );
}
