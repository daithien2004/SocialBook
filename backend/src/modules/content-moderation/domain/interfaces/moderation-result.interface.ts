export interface ModerationResult {
  isSafe: boolean;
  isSpoiler: boolean;
  isToxic: boolean;
  reason?: string;
  matchedWord?: string;
  action: 'ALLOW' | 'REVIEW' | 'BLOCK';
  category: 'toxic' | 'spoiler' | 'spam' | 'hate_speech' | 'none';
  score: number; // 0-100
}
