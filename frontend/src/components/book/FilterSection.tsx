'use client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiltersData } from '@/features/books/types/book.interface';
import { Filter } from 'lucide-react';

interface FilterSectionProps {
  allGenres: FiltersData['genres'];
  allTags: FiltersData['tags'];
  selectedGenres: string[];
  selectedTags: string[];
  onToggleGenre: (slug: string) => void;
  onToggleTag: (tag: string) => void;
  onClearGenres: () => void;
}

export const FilterSection = ({
  allGenres,
  allTags,
  selectedGenres,
  selectedTags,
  onToggleGenre,
  onToggleTag,
  onClearGenres,
}: FilterSectionProps) => {
  return (
    <Card className="border-gray-100 dark:border-white/10 shadow-sm">
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-white/5">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Filter size={16} className="text-red-500" />
          Bộ lọc
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* Genres */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Thể loại
            </h3>
            {selectedGenres.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {selectedGenres.length}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedGenres.length === 0 ? "default" : "outline"}
              size="sm"
              onClick={onClearGenres}
              className={cn(
                "h-8 transition-all",
                selectedGenres.length === 0
                  ? "bg-red-600 hover:bg-red-700 text-white border-transparent"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Tất cả
            </Button>
            {allGenres?.map((genre) => (
              <Button
                key={genre.id}
                variant={selectedGenres.includes(genre.slug) ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleGenre(genre.slug)}
                className={cn(
                  "h-8 transition-all",
                  selectedGenres.includes(genre.slug)
                    ? "bg-red-600 hover:bg-red-700 text-white border-transparent"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {genre.name}
                {genre.count > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 text-xs opacity-60",
                      selectedGenres.includes(genre.slug) ? "text-white/80" : "text-muted-foreground"
                    )}
                  >
                    ({genre.count})
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Tags */}
        {allTags?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-t border-dashed border-gray-200 dark:border-white/10 pt-4">
              Tags phổ biến
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag.name}
                  variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                  onClick={() => onToggleTag(tag.name)}
                  className={cn(
                    "cursor-pointer px-3 py-1 text-xs transition-all hover:border-foreground/50",
                    selectedTags.includes(tag.name)
                      ? "bg-foreground text-background hover:bg-foreground/90 border-transparent"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  #{tag.name}{' '}
                  <span className="ml-1 opacity-60">({tag.count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
