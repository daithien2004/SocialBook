'use client';
import { Filter, Check, Library, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiltersData } from '@/features/books/types/book.interface';

interface FilterSectionProps {
  allGenres: FiltersData['genres'];
  allTags: FiltersData['tags'];
  selectedGenres: string[];
  selectedTags: string[];
  onToggleGenre: (slug: string) => void;
  onToggleTag: (tag: string) => void;
  onClearGenres: () => void;
  onClearFilters?: () => void;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer select-none',
        active
          ? 'bg-brand/10 border-brand/30 text-brand font-medium'
          : 'bg-transparent border-border/60 text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      {children}
    </button>
  );
}

export const FilterSection = ({
  allGenres,
  allTags,
  selectedGenres,
  selectedTags,
  onToggleGenre,
  onToggleTag,
  onClearGenres,
  onClearFilters,
}: FilterSectionProps) => {
  const hasActiveFilters = selectedGenres.length > 0 || selectedTags.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
          <Filter size={14} className="text-brand" />
          Bộ lọc
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-brand-foreground text-[10px] font-bold">
              {selectedGenres.length + selectedTags.length}
            </span>
          )}
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* Genres */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <Library size={14} className="text-muted-foreground/70" />
            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Thể loại
            </span>
          </div>
          <div className="flex flex-col gap-0.5 max-h-[320px] overflow-y-auto thin-scrollbar pr-1 -mr-1">
            <label 
              className={cn(
                "group flex items-center justify-between gap-2 cursor-pointer px-2 py-2 rounded-md transition-all",
                selectedGenres.length === 0 ? "bg-muted/60" : "hover:bg-muted/40"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                  selectedGenres.length === 0 ? "bg-brand border-brand text-brand-foreground" : "border-border bg-background"
                )}>
                  {selectedGenres.length === 0 && <Check size={10} strokeWidth={3} />}
                </div>
                <span className={cn(
                  "text-sm transition-colors",
                  selectedGenres.length === 0 ? "text-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  Tất cả thể loại
                </span>
              </div>
              <input type="checkbox" className="sr-only" checked={selectedGenres.length === 0} onChange={onClearGenres} />
            </label>
            
            {allGenres?.map((genre) => {
              const isSelected = selectedGenres.includes(genre.slug);
              return (
                <label 
                  key={genre.id} 
                  className={cn(
                    "group flex items-center justify-between gap-2 cursor-pointer px-2 py-2 rounded-md transition-all",
                    isSelected ? "bg-brand/10" : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-brand border-brand text-brand-foreground shadow-sm" : "border-border bg-background"
                    )}>
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className={cn(
                      "text-sm truncate transition-colors",
                      isSelected ? "text-brand font-semibold" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {genre.name}
                    </span>
                  </div>
                  {genre.count > 0 && (
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      isSelected ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                    )}>
                      {genre.count}
                    </span>
                  )}
                  <input type="checkbox" className="sr-only" checked={isSelected} onChange={() => onToggleGenre(genre.slug)} />
                </label>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        {allTags?.length > 0 && (
          <div className="flex flex-col gap-3 pt-5 border-t border-border/40">
            <div className="flex items-center gap-2 px-1">
              <Hash size={14} className="text-muted-foreground/70" />
              <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Tags phổ biến
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <Chip
                  key={tag.name}
                  active={selectedTags.includes(tag.name)}
                  onClick={() => onToggleTag(tag.name)}
                >
                  #{tag.name}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active filters clear button */}
      {hasActiveFilters && onClearFilters && (
        <div className="pt-4 border-t border-border/40 mt-4">
          <button
            type="button"
            onClick={onClearFilters}
            className="w-full py-2 text-sm font-medium text-brand bg-brand/10 hover:bg-brand/20 rounded-lg transition-colors"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}
    </section>
  );
};
