'use client';
import { Filter, Hash, Check, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiltersData } from '@/features/books/types/book.interface';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HorizontalFiltersProps {
  allGenres: FiltersData['genres'];
  allTags: FiltersData['tags'];
  selectedGenres: string[];
  selectedTags: string[];
  onToggleGenre: (slug: string) => void;
  onToggleTag: (tag: string) => void;
  onClearGenres: () => void;
  onClearFilters?: () => void;
}

export const HorizontalFilters = ({
  allGenres,
  allTags,
  selectedGenres,
  selectedTags,
  onToggleGenre,
  onToggleTag,
  onClearGenres,
}: HorizontalFiltersProps) => {
  return (
    <div className="w-full bg-background border-b border-border/40 sticky top-16 z-30 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 md:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          
          <div className="flex items-center gap-2">
            {/* Genres Dropdown Button */}
            {allGenres?.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full gap-2 text-sm font-medium h-9">
                    <LayoutGrid size={14} className="text-muted-foreground" />
                    Thể loại
                    {selectedGenres.length > 0 && (
                      <span className="flex items-center justify-center bg-brand/10 text-brand w-5 h-5 rounded-full text-[10px] ml-1">
                        {selectedGenres.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-4 border-b border-border/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={16} className="text-muted-foreground" />
                      <span className="font-semibold text-sm">Chọn Thể loại</span>
                    </div>
                    {selectedGenres.length > 0 && (
                      <button onClick={onClearGenres} className="text-xs text-brand hover:underline">
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  <ScrollArea className="h-[300px] p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={onClearGenres}
                        className={cn(
                          "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors border",
                          selectedGenres.length === 0 
                            ? "bg-foreground text-background border-foreground" 
                            : "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Tất cả
                      </button>
                      
                      {allGenres.map((genre) => {
                        const isSelected = selectedGenres.includes(genre.slug);
                        return (
                          <button
                            key={genre.id}
                            onClick={() => onToggleGenre(genre.slug)}
                            className={cn(
                              "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors border",
                              isSelected 
                                ? "bg-brand/10 border-brand/20 text-brand" 
                                : "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {isSelected && <Check size={14} strokeWidth={3} className="mr-1" />}
                            {genre.name}
                            {genre.count !== undefined && (
                              <span className="opacity-50 ml-1.5 text-[10px]">{genre.count}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}

            {/* Tags Dropdown Button */}
            {allTags?.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full gap-2 text-sm font-medium h-9">
                    <Filter size={14} className="text-muted-foreground" />
                    Lọc Tags
                    {selectedTags.length > 0 && (
                      <span className="flex items-center justify-center bg-brand/10 text-brand w-5 h-5 rounded-full text-[10px] ml-1">
                        {selectedTags.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-4 border-b border-border/50 flex items-center gap-2">
                    <Hash size={16} className="text-muted-foreground" />
                    <span className="font-semibold text-sm">Chọn Tags phổ biến</span>
                  </div>
                  <ScrollArea className="h-[300px] p-4">
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => {
                        const isActive = selectedTags.includes(tag.name);
                        return (
                          <button
                            key={tag.name}
                            onClick={() => onToggleTag(tag.name)}
                            className={cn(
                              "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors border",
                              isActive
                                ? "bg-foreground text-background border-foreground"
                                : "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            #{tag.name}
                            <span className="opacity-50 ml-1.5 text-[10px]">{tag.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
