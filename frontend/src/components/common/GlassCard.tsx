import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
}

export function GlassCard({ children, className, header }: GlassCardProps) {
  return (
    <div
      className={cn(
        'bg-white/60 dark:bg-white/5 backdrop-blur-xl',
        'border border-border/60 dark:border-border',
        'rounded-3xl overflow-hidden shadow-lg dark:shadow-xl',
        className
      )}
    >
      {header && (
        <div className="px-5 py-4 border-b border-border/60 dark:border-border bg-primary/[0.03] dark:bg-muted/30">
          {header}
        </div>
      )}
      {children}
    </div>
  );
}
