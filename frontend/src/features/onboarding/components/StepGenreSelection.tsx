'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGetFiltersQuery } from '../../books/api/bookApi';

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {filtersData?.genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => toggleGenre(genre.id)}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
              ${
                selected.includes(genre.id)
                  ? 'border-black bg-neutral-100 dark:bg-white/10 dark:border-white text-black dark:text-white'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            <span className="font-medium dark:text-gray-200">{genre.name}</span>
          </button>
        ))}
      </div>

      <Button
        className="w-full bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        disabled={selected.length < 3}
        onClick={() => onSubmit({ favoriteGenres: selected })}
      >
        Tiếp tục (đã chọn {selected.length})
      </Button>
    </motion.div>
  );
}
