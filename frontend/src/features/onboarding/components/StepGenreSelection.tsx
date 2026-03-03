'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';
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
              ${selected.includes(genre.id)
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
              }
            `}
          >
            <span className="font-medium">{genre.name}</span>
          </button>
        ))}
      </div>

      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500"
        disabled={selected.length < 3}
        onClick={() => onSubmit({ favoriteGenres: selected })}
      >
        Tiếp tục (đã chọn {selected.length})
      </Button>
    </motion.div>
  );
}
