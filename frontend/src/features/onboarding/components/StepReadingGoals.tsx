'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function StepReadingGoals({ onSubmit, initialData }: any) {
  const [goal, setGoal] = useState(
    initialData.readingGoal || {
      type: 'daily',
      amount: 30,
      unit: 'minutes',
    }
  );

  const unitOptions = [
    { value: 'minutes', label: 'Phút', amounts: [15, 30, 60] },
    { value: 'pages', label: 'Trang', amounts: [10, 25, 50] },
    { value: 'books', label: 'Sách', amounts: [1, 2, 3] },
  ];

  const currentUnitConfig =
    unitOptions.find((opt) => opt.value === goal.unit) || unitOptions[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 className="text-2xl font-bold mb-2 dark:text-white">
        Xây dựng thói quen đọc sách
      </h2>
      <p className="text-gray-500 mb-8">
        Những mục tiêu nhỏ hàng ngày sẽ dẫn đến thành tựu lớn.
      </p>

      <div className="space-y-6 mb-8">
        <label className="block">
          <span className="text-sm font-medium dark:text-gray-300">
            Đo lường bằng:
          </span>
          <div className="mt-2 flex gap-3">
            {unitOptions.map((option) => (
              <Button
                key={option.value}
                variant={goal.unit === option.value ? 'default' : 'outline'}
                onClick={() =>
                  setGoal({
                    ...goal,
                    unit: option.value,
                    amount: option.amounts[1],
                  })
                }
                className={cn(
                  "flex-1 py-6 rounded-xl font-bold transition-all duration-300",
                  goal.unit === option.value && "shadow-md scale-105"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium dark:text-gray-300">
            Tôi muốn đọc:
          </span>
          <div className="mt-2 flex gap-3">
            {currentUnitConfig.amounts.map((amount) => (
              <Button
                key={amount}
                variant={goal.amount === amount ? 'default' : 'outline'}
                onClick={() => setGoal({ ...goal, amount })}
                className={cn(
                  "flex-1 py-6 rounded-xl font-bold transition-all duration-300",
                  goal.amount === amount && "shadow-md scale-105"
                )}
              >
                {amount} {goal.unit === 'minutes' ? 'phút' : goal.unit === 'pages' ? 'trang' : 'cuốn'}
              </Button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium dark:text-gray-300">
            Tần suất:
          </span>
          <div className="mt-2 flex gap-3">
            {[
              { id: 'daily', label: 'Mỗi ngày' },
              { id: 'weekly', label: 'Mỗi tuần' },
              { id: 'monthly', label: 'Mỗi tháng' }
            ].map((type) => (
              <Button
                key={type.id}
                variant={goal.type === type.id ? 'default' : 'outline'}
                onClick={() => setGoal({ ...goal, type: type.id })}
                className={cn(
                  "flex-1 py-6 rounded-xl font-bold transition-all duration-300",
                  goal.type === type.id && "shadow-md scale-105"
                )}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </label>
      </div>

      <Button
        className="w-full h-12 rounded-xl font-bold shadow-lg"
        onClick={() => onSubmit({ readingGoal: goal })}
      >
        Thiết lập mục tiêu
      </Button>
    </motion.div>
  );
}
