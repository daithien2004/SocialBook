'use client';

import {
  useCheckInStreakMutation,
  useGetDailyGoalQuery,
  useGetStreakQuery,
} from '@/features/gamification/api/gamificationApi';
import { Flame, Target, Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface HeaderGamificationSummaryProps {
  userId?: string;
}

export default function HeaderGamificationSummary({
  userId,
}: HeaderGamificationSummaryProps) {
  const { data: streakData } = useGetStreakQuery();
  const { data: dailyGoal } = useGetDailyGoalQuery();
  const [checkInStreak] = useCheckInStreakMutation();

  useEffect(() => {
    if (!userId) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const checkInKey = `streak-checked-in-${userId}-${todayStr}`;
    if (localStorage.getItem(checkInKey)) return;

    const performCheckIn = async () => {
      try {
        const result = await checkInStreak().unwrap();
        localStorage.setItem(checkInKey, 'true');
        if (result.message === 'Streak updated') {
          toast.success(`Streak updated! ${result.currentStreak} day(s)`, {
            icon: '🔥',
            style: { borderRadius: '10px', background: '#333', color: '#fff' },
          });
        }
      } catch {
        // Keep header resilient: silent failure here is acceptable.
      }
    };

    performCheckIn();
  }, [checkInStreak, userId]);

  useEffect(() => {
    if (!dailyGoal || !userId) return;

    const minutesGoal = dailyGoal.goals?.minutes;
    const current = minutesGoal?.current || 0;
    const target = minutesGoal?.target || 90;

    const todayStr = new Date().toISOString().split('T')[0];
    const celebrationKey = `daily-goal-celebrated-${userId}-${todayStr}`;
    const hasCelebratedToday = localStorage.getItem(celebrationKey);

    if (current < target || hasCelebratedToday) return;

    localStorage.setItem(celebrationKey, 'true');
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.3 },
        colors: ['#FFD700', '#FFA500', '#ffffff'],
      });
    });
    toast.success('Xuáº¥t sáº¯c! Báº¡n Ä‘Ã£ Ä‘áº¡t má»¥c tiÃªu hÃ´m nay!');
  }, [dailyGoal, userId]);

  if (!dailyGoal && !streakData) {
    return null;
  }

  const currentMinutes = dailyGoal?.goals?.minutes?.current || 0;
  const targetMinutes = dailyGoal?.goals?.minutes?.target || 90;
  const goalCompleted = currentMinutes >= targetMinutes;
  const currentStreak = streakData?.currentStreak || 0;

  return (
    <>
      {dailyGoal && (
        <div
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
            goalCompleted
              ? 'bg-yellow-100 dark:bg-yellow-500/20 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-400'
              : 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400'
          }`}
          title="Má»¥c tiÃªu Ä‘á»c sÃ¡ch hÃ´m nay"
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
      )}

      <div
        className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400"
        title="Chuá»—i ngÃ y Ä‘á»c sÃ¡ch liÃªn tiáº¿p"
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
    </>
  );
}
