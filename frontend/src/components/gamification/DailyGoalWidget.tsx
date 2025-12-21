'use client';

import { useGetDailyGoalQuery } from '@/src/features/gamification/api/gamificationApi';
import { Target } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Trophy } from 'lucide-react';

export function DailyGoalWidget() {
  const { status } = useSession();
  const { data: dailyGoal, isLoading } = useGetDailyGoalQuery(undefined, {
    skip: status !== 'authenticated',
  });

  if (isLoading || !dailyGoal) return null;

  const minutesGoal = dailyGoal.goals?.minutes;
  const pagesGoal = dailyGoal.goals?.pages;

  const currentGoal = minutesGoal || pagesGoal || { current: 0, target: 10 };
  const unitLabel = minutesGoal ? 'phút' : 'trang';
  const progress = Math.min((currentGoal.current / currentGoal.target) * 100, 100);
  const isCompleted = progress >= 100;

  return (
    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {isCompleted ? <Trophy size={18} className="text-yellow-500" /> : <Target size={18} className="text-blue-500" />}
          {isCompleted ? 'Mục tiêu hoàn thành' : 'Mục tiêu hôm nay'}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {isCompleted ? 'Xuất sắc!' : 'Đang thực hiện'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-colors">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500 dark:text-gray-400 font-medium">
              Tiến độ
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {currentGoal.current} <span className="text-xs font-normal text-gray-400">/ {currentGoal.target} {unitLabel}</span>
            </span>
          </div>
          
          <div className="h-2 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-white/10">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-yellow-500' : 'bg-blue-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          {isCompleted ? 'Bạn đã hoàn thành mục tiêu ngày hôm nay. Tiếp tục giữ vững nhé!' : 'Hãy dành chút thời gian đọc sách để đạt mục tiêu nhé!'}
        </p>
      </div>
    </div>
  );
}
