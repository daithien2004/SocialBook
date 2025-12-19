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
    <div className={`rounded-2xl p-6 border shadow-sm transition-all duration-500
      ${isCompleted 
        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700' 
        : 'bg-white dark:bg-[#1e1e1e] border-gray-100 dark:border-zinc-800'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl 
          ${isCompleted 
            ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' 
            : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
          }`}
        >
          {isCompleted ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
        </div>
        <div>
          <h3 className={`font-bold ${isCompleted ? 'text-yellow-900 dark:text-yellow-100' : 'text-gray-900 dark:text-gray-100'}`}>
            {isCompleted ? 'Mục tiêu hoàn thành!' : 'Mục tiêu hôm nay'}
          </h3>
          <p className={`text-xs ${isCompleted ? 'text-yellow-700 dark:text-yellow-200' : 'text-gray-500 dark:text-gray-400'}`}>
            {isCompleted ? 'Bạn thật tuyệt vời!' : 'Tiếp tục cố gắng nhé!'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className={isCompleted ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-600 dark:text-gray-400'}>
              {isCompleted ? 'Đã đạt được' : 'Đã hoàn thành'}
            </span>
            <span className={`font-bold ${isCompleted ? 'text-yellow-900 dark:text-yellow-100' : 'text-gray-900 dark:text-gray-100'}`}>
              {currentGoal.current} / {currentGoal.target} {unitLabel}
            </span>
          </div>
          <div className={`h-2.5 w-full rounded-full overflow-hidden ${isCompleted ? 'bg-yellow-200 dark:bg-yellow-900/50' : 'bg-gray-100 dark:bg-zinc-800'}`}>
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
