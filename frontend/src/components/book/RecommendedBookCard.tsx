'use client';

import React, { memo, useCallback, useState } from 'react';
import { BookCard } from './BookCard';
import { Book } from '@/features/books/types/book.interface';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendedBookCardProps {
  book: Book;
  matchScore: number;
  reason: string;
}

export const RecommendedBookCard = memo(function RecommendedBookCard({
  book,
  matchScore,
  reason,
}: RecommendedBookCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = reason.length > 100;

  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className="group relative">
      <BookCard book={book} />
      
      {/* Recommendation Badge */}
      <div className="absolute -top-2 -right-2 z-10">
        <div className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white/20 animate-pulse">
          <Sparkles size={10} />
          <span>{matchScore}% MATCH</span>
        </div>
      </div>

      {/* Recommendation Reason Tooltip/Overlay */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 z-20 bg-background/95 backdrop-blur-md border-t border-border transition-all duration-300 ease-in-out p-3 rounded-b-xl shadow-[0_-4px_10px_rgba(0,0,0,0.1)]",
        isExpanded ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
      )}>
        <p className="text-xs text-foreground/80 leading-relaxed italic">
          "{reason}"
        </p>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleExpanded}
        className="absolute bottom-2 right-2 z-30 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
        title={isExpanded ? "Hide reason" : "Why this?"}
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  );
});
