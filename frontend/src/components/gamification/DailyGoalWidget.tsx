'use client';

import { useGetDailyGoalQuery } from '@/src/features/gamification/api/gamificationApi';
import { Target } from 'lucide-react';
import { useSession } from 'next-auth/react';

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

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            Mục tiêu hôm nay
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tiếp tục cố gắng nhé!
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Đã hoàn thành</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {currentGoal.current} / {currentGoal.target} {unitLabel}
            </span>
          </div>
          <div className="h-2.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
