'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

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
          <div className="mt-2 flex gap-4">
            {unitOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setGoal({
                    ...goal,
                    unit: option.value,
                    amount: option.amounts[1], // Set to middle option when changing unit
                  })
                }
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all
                  ${
                    goal.unit === option.value
                      ? 'border-black bg-neutral-100 dark:bg-white/10 dark:border-white text-black dark:text-white'
                      : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium dark:text-gray-300">
            Tôi muốn đọc:
          </span>
          <div className="mt-2 flex gap-4">
            {currentUnitConfig.amounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setGoal({ ...goal, amount })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all
                  ${
                    goal.amount === amount
                     ? 'border-black bg-neutral-100 dark:bg-white/10 dark:border-white text-black dark:text-white'
                      : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'
                  }`}
              >
                {amount} {goal.unit === 'minutes' ? 'phút' : goal.unit === 'pages' ? 'trang' : 'cuốn'}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium dark:text-gray-300">
            Tần suất:
          </span>
          <div className="mt-2 flex gap-4">
            {[
              { id: 'daily', label: 'Mỗi ngày' },
              { id: 'weekly', label: 'Mỗi tuần' },
              { id: 'monthly', label: 'Mỗi tháng' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setGoal({ ...goal, type: type.id })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold capitalize transition-all
                  ${
                    goal.type === type.id
                      ? 'border-black bg-neutral-100 dark:bg-white/10 dark:border-white text-black dark:text-white'
                      : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'
                  }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </label>
      </div>

      <Button
        className="w-full bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        onClick={() => onSubmit({ readingGoal: goal })}
      >
        Thiết lập mục tiêu
      </Button>
    </motion.div>
  );
}
