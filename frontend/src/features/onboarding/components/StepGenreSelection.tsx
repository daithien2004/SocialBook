'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useGetFiltersQuery } from '../../books/api/bookApi';
import { cn } from '@/lib/utils';

export default function StepGenreSelection({ onSubmit, initialData }: any) {
  const { data: filtersData, isLoading: isFiltersLoading } =
    useGetFiltersQuery();

  const [selected, setSelected] = useState<string[]>(
    initialData.favoriteGenres || []
  );

  const toggleGenre = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 className="text-2xl font-bold mb-2 dark:text-white">
        Bạn thích đọc thể loại nào nhất?
      </h2>
      <p className="text-gray-500 mb-6">Chọn ít nhất 3 thể loại để chúng tôi gợi ý sách phù hợp.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {filtersData?.genres.map((genre) => {
          const isSelected = selected.includes(genre.id);
          return (
            <Button
              key={genre.id}
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => toggleGenre(genre.id)}
              className={cn(
                "h-auto py-4 px-2 rounded-xl flex flex-col items-center gap-2 transition-all duration-300",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                  : "hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <span className="font-semibold text-sm truncate w-full text-center">{genre.name}</span>
            </Button>
          );
        })}
      </div>

      <Button
        className="w-full h-12 rounded-xl font-bold shadow-lg"
        disabled={selected.length < 3}
        onClick={() => onSubmit({ favoriteGenres: selected })}
      >
        Tiếp tục ({selected.length} đã chọn)
      </Button>
    </motion.div>
  );
}
