import React from 'react';
import { cn } from '@/lib/utils';

interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export function BaseCard({
  children,
  className,
  hoverEffect = false,
  ...props
}: BaseCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-border p-4 transition-all duration-200",
        hoverEffect && "hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-800 hover:-translate-y-[1px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
