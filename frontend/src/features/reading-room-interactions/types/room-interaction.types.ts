export type ReactionType = 'cry' | 'angry' | 'laugh' | 'think' | 'shock' | 'heart' | 'fire' | 'calm';

export const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  cry:    { emoji: '😢', label: 'Buồn' },
  angry:  { emoji: '😡', label: 'Tức' },
  laugh:  { emoji: '😂', label: 'Cười' },
  think:  { emoji: '🤔', label: 'Suy nghĩ' },
  shock:  { emoji: '😮', label: 'Bất ngờ' },
  heart:  { emoji: '❤️', label: 'Yêu thích' },
  fire:   { emoji: '🔥', label: 'Đỉnh' },
  calm:   { emoji: '😌', label: 'Nhẹ nhàng' },
};

export interface RoomComment {
  id: string;
  paragraphId: string;
  chapterSlug: string;
  content: string;
  userId: string;
  displayName?: string;
  parentCommentId?: string;
  createdAt: string;
}

export interface RoomReactionEvent {
  id: string;
  paragraphId: string;
  reactionType: ReactionType;
  userId: string;
  displayName: string;
  createdAt: string;
}

export interface ParagraphReactionSummary {
  paragraphId: string;
  reactions: Record<string, number>;
  userReactions: Array<{ type: string; userId: string }>;
}

export interface QuoteVote {
  userId: string;
  type: 'up' | 'down';
}

export interface RoomSocket {
  on(event: string, handler: (...args: unknown[]) => void): void;
}

export interface RoomQuote {
  id: string;
  content: string;
  userId: string;
  displayName?: string;
  chapterSlug: string;
  paragraphId: string;
  votes: QuoteVote[];
  voteCount: number;
  createdAt: string;
}
