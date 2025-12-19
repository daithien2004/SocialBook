export interface GamificationStats {
  userId: string;
  currentStreak: number;
}

export interface Achievement {
  _id: string;
  code: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  progress: number;
  badgeUrl: string;
}
