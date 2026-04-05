'use client';

import { Flame, Target, Trophy } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGamificationCheckIn } from './hooks/useGamificationCheckIn';

interface HeaderGamificationSummaryProps {
  userId?: string;
}

export default function HeaderGamificationSummary({
  userId,
}: HeaderGamificationSummaryProps) {
  const { dailyGoal, streakData, isLoading } = useGamificationCheckIn({ userId });

  if (isLoading) {
    return null;
  }

  if (!dailyGoal && streakData === 0) {
    return null;
  }

  const currentMinutes = dailyGoal?.goals?.minutes?.current || 0;
  const targetMinutes = dailyGoal?.goals?.minutes?.target || 90;
  const goalCompleted = currentMinutes >= targetMinutes;
  const currentStreak = streakData;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {dailyGoal && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-help transition-all hover:scale-105 active:scale-95 ${
                  goalCompleted
                    ? 'bg-yellow-100 dark:bg-yellow-500/20 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-400'
                    : 'bg-primary/10 border-primary/20 text-primary dark:text-primary-foreground/90 shadow-sm'
                }`}
              >
                {goalCompleted ? (
                  <Trophy className="w-4 h-4" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                <span className="text-sm font-bold font-mono">
                  {currentMinutes}/{targetMinutes}p
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="rounded-xl border-border bg-popover text-popover-foreground shadow-lg px-3 py-2">
              <p className="text-xs font-semibold">Mục tiêu đọc sách hôm nay</p>
              <p className="text-[10px] text-muted-foreground">{goalCompleted ? 'Đã hoàn thành!' : `Còn ${targetMinutes - currentMinutes} phút nữa`}</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 cursor-help transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <Flame
                className={`w-4 h-4 ${
                  currentStreak > 0
                    ? 'fill-orange-500 text-orange-500'
                    : 'text-orange-300'
                }`}
              />
              <span className="text-sm font-bold font-mono">{currentStreak}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="rounded-xl border-border bg-popover text-popover-foreground shadow-lg px-3 py-2">
            <p className="text-xs font-semibold">Chuỗi ngày đọc sách</p>
            <p className="text-[10px] text-muted-foreground">{currentStreak > 0 ? `Bạn đã duy trì ${currentStreak} ngày!` : 'Bắt đầu chuỗi ngày mới thôi!'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
