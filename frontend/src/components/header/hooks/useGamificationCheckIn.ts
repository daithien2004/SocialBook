import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    useCheckInStreakMutation,
    useGetDailyGoalQuery,
    useGetStreakQuery,
} from '@/features/gamification/api/gamificationApi';

export interface UseGamificationCheckInOptions {
    userId?: string;
}

export interface UseGamificationCheckInResult {
    dailyGoal: ReturnType<typeof useGetDailyGoalQuery>['data'];
    streakData: number;
    isLoading: boolean;
}

export function useGamificationCheckIn({
    userId,
}: UseGamificationCheckInOptions): UseGamificationCheckInResult {
    const { data: dailyGoal, isLoading: isLoadingDailyGoal } = useGetDailyGoalQuery();
    const { data: streakData, isLoading: isLoadingStreak } = useGetStreakQuery();
    const [checkInStreak] = useCheckInStreakMutation();

    const performCheckIn = useCallback(async () => {
        if (!userId) return;

        const todayStr = new Date().toISOString().split('T')[0];
        const checkInKey = `streak-checked-in-${userId}-${todayStr}`;
        if (localStorage.getItem(checkInKey)) return;

        try {
            const result = await checkInStreak().unwrap();
            localStorage.setItem(checkInKey, 'true');
            if (result.message === 'Streak updated') {
                toast.success(`Chuỗi ngày đã cập nhật! ${result.currentStreak} ngày`, {
                    icon: '🔥',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' },
                });
            }
        } catch {
            // Keep header resilient: silent failure here is acceptable.
        }
    }, [userId, checkInStreak]);

    useEffect(() => {
        performCheckIn();
    }, [performCheckIn]);

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
        toast.success('Xuất sắc! Bạn đã đạt mục tiêu hôm nay!');
    }, [dailyGoal, userId]);

    return {
        dailyGoal,
        streakData: streakData?.currentStreak || 0,
        isLoading: isLoadingDailyGoal || isLoadingStreak,
    };
}
