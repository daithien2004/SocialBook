'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function StepReadingHabits({ onSubmit, initialData }: any) {
  const [times, setTimes] = useState(initialData.readingTime || {});

  const toggleTime = (key: string) => {
    setTimes((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const OPTIONS = [
    { key: 'morning', label: '🌅 Sáng sớm', sub: 'Trước khi làm việc/đi học' },
    { key: 'commute', label: '🚌 Di chuyển', sub: 'Trên đường đi' },
    { key: 'lunch', label: '🍱 Nghỉ trưa', sub: 'Giờ nghỉ giữa ngày' },
    { key: 'evening', label: '🌇 Buổi tối', sub: 'Sau giờ làm việc' },
    { key: 'bedtime', label: '🌙 Trước khi ngủ', sub: 'Thư giãn cuối ngày' },
    { key: 'weekend', label: '☕ Cuối tuần', sub: 'Thời gian rảnh rỗi' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 className="text-2xl font-bold mb-2 dark:text-white">Bạn thường đọc sách khi nào?</h2>
      <p className="text-gray-500 mb-6">Chúng tôi sẽ giúp bạn duy trì thói quen với những lời nhắc nhở thông minh.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => toggleTime(opt.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all
              ${times[opt.key]
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
              }`}
          >
            <div className={`font-semibold ${times[opt.key] ? 'text-indigo-700 dark:text-indigo-300' : 'dark:text-gray-200'}`}>
              {opt.label}
            </div>
            <div className="text-sm text-gray-400">{opt.sub}</div>
          </button>
        ))}
      </div>

      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500"
        onClick={() => onSubmit({ readingTime: times })}
      >
        Sắp xong rồi
      </Button>
    </motion.div>
  );
}
