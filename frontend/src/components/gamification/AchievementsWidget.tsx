'use client';

import { useGetUserAchievementsQuery } from '@/src/features/gamification/api/gamificationApi';
import { Trophy, Medal, Award } from 'lucide-react';
import { useAppAuth } from '@/src/hooks/useAppAuth';

export function AchievementsWidget() {
  const { isAuthenticated } = useAppAuth();
  const { data: achievementsData, isLoading } = useGetUserAchievementsQuery(
    undefined,
    {
      skip: !isAuthenticated,
    }
  );

  // Handle both array and object response formats
  const achievements = Array.isArray(achievementsData)
    ? achievementsData
    : achievementsData?.data ?? [];

  if (isLoading || achievements.length === 0) return null;

  const displayList = achievements.slice(0, 3);

  return (
    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" />
          Thành tựu
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {achievements.length} đã đạt
        </span>
      </div>

      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            Chưa có thành tựu nào. Hãy đọc sách để mở khóa!
          </div>
        ) : (
          displayList.map((item: any, index: number) => {
            const achievement = item.achievementId;
            return (
              <div
                key={item._id || item.id || index}
                className="flex items-start gap-3 p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-colors"
              >
                <div className="p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded-full shrink-0">
                  <Medal
                    size={16}
                    className="text-yellow-600 dark:text-yellow-400"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                    {achievement.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {achievement.description}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {achievements.length > 3 && (
        <button className="w-full mt-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
          Xem tất cả
        </button>
      )}
    </div>
  );
}
