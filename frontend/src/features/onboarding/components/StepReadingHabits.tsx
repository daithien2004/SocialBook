'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {OPTIONS.map(opt => {
          const isSelected = times[opt.key];
          return (
            <Button
              key={opt.key}
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => toggleTime(opt.key)}
              className={cn(
                "h-auto p-4 flex flex-col items-start gap-1 rounded-xl transition-all duration-300",
                isSelected ? "shadow-md scale-[1.02]" : "hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <div className="font-bold text-sm">
                {opt.label}
              </div>
              <div className={cn(
                "text-xs",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {opt.sub}
              </div>
            </Button>
          );
        })}
      </div>

      <Button
        className="w-full h-12 rounded-xl font-bold shadow-lg"
        onClick={() => onSubmit({ readingTime: times })}
      >
        Tiếp tục nào
      </Button>
    </motion.div>
  );
}
