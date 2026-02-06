'use client';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';
import { SORT_OPTIONS } from '@/src/features/books/books.constants';
import { ChevronDown } from 'lucide-react';

interface SortDropdownProps {
  currentSort: string;
  currentOrder: 'asc' | 'desc';
  onSortChange: (sort: string, order: 'asc' | 'desc') => void;
}

export const SortDropdown = ({
  currentSort,
  currentOrder,
  onSortChange,
}: SortDropdownProps) => {
  const activeLabel =
    SORT_OPTIONS.find(
      (s) => s.value === currentSort && s.order === currentOrder
    )?.label || 'Sắp xếp';

  return (
    <div className="lg:w-64 flex-shrink-0">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Sắp xếp theo
      </h3>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-background border-input hover:bg-accent hover:text-accent-foreground font-normal"
          >
            {activeLabel}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={`${option.value}-${option.order}`}
              onClick={() => onSortChange(option.value, option.order)}
              className={cn(
                "cursor-pointer",
                currentSort === option.value && currentOrder === option.order
                  ? "bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:focus:bg-red-900/30"
                  : ""
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
