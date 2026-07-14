import { create } from 'zustand';
import { RoomResponse } from '@/features/reading-rooms/api/readingRoomsApi';
import type { RoomComment, ReactionType, ParagraphReactionSummary, RoomQuote } from '@/features/reading-room-interactions/types/room-interaction.types';
import { REACTION_META } from '@/features/reading-room-interactions/types/room-interaction.types';

export interface PresenceData {
  userId: string;
  displayName: string;
  avatarUrl: string;
  currentChapterSlug: string;
  paragraphId?: string;
  lastSeen: number;
  progress?: number;
}

export interface RoomHighlight {
  id: string;
  userId: string;
  chapterSlug: string;
  paragraphId: string;
  content: string;
  aiInsight?: string;
  createdAt: string;
  user?: {
    userId: string;
    displayName: string;
    avatarUrl: string;
  };
}

export interface ChatMessage {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export interface EmotionEvent {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  emoji: string;
  reactionType: string;
  paragraphId: string;
  paragraphPreview: string; // first ~50 chars of paragraph text
  timestamp: number;
}

// User color palette for collaborative selections (assigned by hash)
export const PARTY_COLORS = [
  { bg: 'oklch(0.75 0.15 85 / 0.35)',  border: 'oklch(0.75 0.15 85)' },
  { bg: 'oklch(0.6 0.14 180 / 0.30)',   border: 'oklch(0.6 0.14 180)' },
  { bg: 'oklch(0.6 0.22 360 / 0.28)',   border: 'oklch(0.6 0.22 360)' },
  { bg: 'oklch(0.55 0.2 300 / 0.28)',  border: 'oklch(0.55 0.2 300)' },
  { bg: 'oklch(0.6 0.14 230 / 0.30)',   border: 'oklch(0.6 0.14 230)' },
  { bg: 'oklch(0.7 0.18 60 / 0.30)',   border: 'oklch(0.7 0.18 60)' },
];

export interface RemoteSelection {
  userId: string;
  displayName: string;
  avatarUrl: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  colorIndex: number;
}

interface ReadingRoomState {
  room: RoomResponse | null;
  members: { userId: string; role: string }[];
  presences: Record<string, PresenceData>;
  annotations: Record<string, number>;
  highlights: RoomHighlight[];
  chatMessages: ChatMessage[];
  setRoom: (room: RoomResponse) => void;

  setMembers: (members: { userId: string; role: string }[]) => void;
  addMember: (userId: string) => void;
  removeMember: (userId: string) => void;
  updatePresences: (presences: PresenceData[]) => void;
  updateAnnotation: (paragraphId: string, count: number) => void;
  removeAnnotation: (paragraphId: string) => void;
  updateChapter: (chapterSlug: string) => void;
  setHighlights: (highlights: RoomHighlight[]) => void;
  addHighlight: (highlight: RoomHighlight) => void;
  removeHighlight: (id: string) => void;
  updateHighlightInsight: (id: string, insight: string) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearRoom: () => void;

  // Room interactions
  roomComments: RoomComment[];
  reactions: Record<string, Record<ReactionType, string[]>>;
  memberProgress: Record<string, number>;
  paragraphActivities: Record<string, { commentCount: number; reactions: Record<string, number>; totalInteractions: number }>;
  quotes: RoomQuote[];

  setRoomComments: (comments: RoomComment[]) => void;
  addRoomComment: (comment: RoomComment) => void;
  removeRoomComment: (commentId: string, paragraphId: string) => void;
  updateReaction: (paragraphId: string, type: ReactionType, userId: string, add: boolean) => void;
  updateMemberProgress: (userId: string, progress: number) => void;
  setParagraphActivity: (activities: ParagraphReactionSummary[]) => void;
  setQuotes: (quotes: RoomQuote[]) => void;
  addQuote: (quote: RoomQuote) => void;
  removeQuote: (quoteId: string) => void;
  updateQuoteVote: (quoteId: string, voteCount: number, userId: string, voteType: 'up' | 'down' | null) => void;

  // Emotion stream (ephemeral, max 50 items FIFO)
  emotionEvents: EmotionEvent[];
  addEmotionEvent: (event: Omit<EmotionEvent, 'id' | 'emoji' | 'paragraphPreview'> & { reactionType: string }) => void;

  // Collaborative selections (ephemeral, per-user, no DB)
  remoteSelections: Record<string, RemoteSelection>; // userId → selection
  setRemoteSelection: (selection: RemoteSelection) => void;
  clearRemoteSelection: (userId: string) => void;

  // Paragraph content registry (for EmotionStream excerpt + scroll)
  paragraphContentMap: Record<string, string>; // paragraphId → plain text
  setParagraphContentMap: (map: Record<string, string>) => void;

  // Scroll-to-paragraph signal (ChapterContent watches this)
  scrollTargetParagraphId: string | null;
  setScrollTargetParagraphId: (id: string | null) => void;
}

export const useReadingRoomStore = create<ReadingRoomState>((set) => ({
  room: null,
  members: [],
  presences: {},
  annotations: {},
  highlights: [],
  chatMessages: [],

  // Room interactions
  roomComments: [],
  reactions: {},
  memberProgress: {},
  paragraphActivities: {},
  quotes: [],
  emotionEvents: [],
  remoteSelections: {},
  paragraphContentMap: {},
  scrollTargetParagraphId: null,

  setRoom: (room) => set({
    room,
    highlights: room.highlights || [],
    chatMessages: room.chatMessages || [],
  }),

  setMembers: (members) => set({ members }),
  addMember: (userId) => set((state) => ({
    members: state.members.some(m => m.userId === userId)
      ? state.members
      : [...state.members, { userId, role: 'member' }],
  })),
  removeMember: (userId) => set((state) => ({
    members: state.members.filter(m => m.userId !== userId),
  })),
  updatePresences: (presencesList) => set((state) => {
    const presencesMap: Record<string, PresenceData> = {};
    presencesList.forEach(p => {
      presencesMap[p.userId] = { ...p, progress: p.progress ?? state.memberProgress[p.userId] };
    });
    return { presences: presencesMap };
  }),
  updateAnnotation: (paragraphId, count) => set((state) => ({
    annotations: { ...state.annotations, [paragraphId]: count },
  })),
  removeAnnotation: (paragraphId) => set((state) => {
    const newAnnotations = { ...state.annotations };
    delete newAnnotations[paragraphId];
    return { annotations: newAnnotations };
  }),
  updateChapter: (chapterSlug) => set((state) => ({
    room: state.room ? { ...state.room, currentChapterSlug: chapterSlug } : null,
  })),
  setHighlights: (highlights) => set({ highlights }),
  addHighlight: (highlight) => set((state) => ({
    highlights: state.highlights.some(h => h.id === highlight.id)
      ? state.highlights
      : [...state.highlights, highlight],
  })),
  updateHighlightInsight: (id, insight) => set((state) => ({
    highlights: state.highlights.map(h => h.id === id ? { ...h, aiInsight: insight } : h),
  })),
  removeHighlight: (id) => set((state) => ({
    highlights: state.highlights.filter(h => h.id !== id),
  })),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) => set((state) => ({
    chatMessages: state.chatMessages.some(
      (m) => m.userId === message.userId && m.content === message.content && m.createdAt === message.createdAt,
    )
      ? state.chatMessages
      : [...state.chatMessages, message],
  })),
  clearRoom: () => set({
    room: null,
    members: [],
    presences: {},
    annotations: {},
    highlights: [],
    chatMessages: [],
    roomComments: [],
    reactions: {},
    memberProgress: {},
    paragraphActivities: {},
    quotes: [],
    emotionEvents: [],
    remoteSelections: {},
    paragraphContentMap: {},
    scrollTargetParagraphId: null,
  }),
  setRemoteSelection: (selection) => set((state) => ({
    remoteSelections: { ...state.remoteSelections, [selection.userId]: selection },
  })),
  clearRemoteSelection: (userId) => set((state) => {
    const next = { ...state.remoteSelections };
    delete next[userId];
    return { remoteSelections: next };
  }),
  setParagraphContentMap: (map) => set({ paragraphContentMap: map }),
  setScrollTargetParagraphId: (id) => set({ scrollTargetParagraphId: id }),

  // Room interaction actions
  setRoomComments: (comments) => set((state) => {
    const annotations: Record<string, number> = {};
    for (const c of comments) {
      if (c.paragraphId) {
        annotations[c.paragraphId] = (annotations[c.paragraphId] || 0) + 1;
      }
    }
    return { roomComments: comments, annotations: { ...state.annotations, ...annotations } };
  }),
  addRoomComment: (comment) => set((state) => ({
    roomComments: [...state.roomComments, comment],
    annotations: {
      ...state.annotations,
      [comment.paragraphId]: (state.annotations[comment.paragraphId] || 0) + 1,
    },
  })),
  removeRoomComment: (commentId, paragraphId) => set((state) => {
    const newComments = state.roomComments.filter(c => c.id !== commentId);
    const remainingCount = newComments.filter(c => c.paragraphId === paragraphId).length;
    return {
      roomComments: newComments,
      annotations: {
        ...state.annotations,
        [paragraphId]: remainingCount,
      },
    };
  }),
  updateReaction: (paragraphId, type, userId, add) => set((state) => {
    const paraReactions = state.reactions[paragraphId] || {} as Record<ReactionType, string[]>;
    const typeUsers = paraReactions[type] || [];
    const newTypeUsers = add
      ? (typeUsers.includes(userId) ? typeUsers : [...typeUsers, userId])
      : typeUsers.filter(u => u !== userId);

    const newParaReactions = { ...paraReactions, [type]: newTypeUsers };
    if (newParaReactions[type]?.length === 0) {
      delete newParaReactions[type];
    }

    return {
      reactions: { ...state.reactions, [paragraphId]: newParaReactions },
    };
  }),
  updateMemberProgress: (userId, progress) => set((state) => ({
    memberProgress: { ...state.memberProgress, [userId]: progress },
    presences: state.presences[userId]
      ? { ...state.presences, [userId]: { ...state.presences[userId], progress } }
      : state.presences,
  })),
  setParagraphActivity: (activities: ParagraphReactionSummary[]) => set((state) => {
    const paraActivities: Record<string, { commentCount: number; reactions: Record<string, number>; totalInteractions: number }> = {};
    activities.forEach(a => {
      paraActivities[a.paragraphId] = {
        commentCount: 0,
        reactions: a.reactions || {},
        totalInteractions: 0,
      };
    });
    return { paragraphActivities: { ...state.paragraphActivities, ...paraActivities } };
  }),
  setQuotes: (quotes) => set({ quotes }),
  addQuote: (quote) => set((state) => {
      const existingIndex = state.quotes.findIndex(q => q.id === quote.id);
      if (existingIndex >= 0) {
        return { quotes: state.quotes.map(q => q.id === quote.id ? quote : q) };
      }
      return { quotes: [quote, ...state.quotes] };
    }),
  removeQuote: (quoteId) =>
    set((state) => ({ quotes: state.quotes.filter((q) => q.id !== quoteId) })),
  updateQuoteVote: (quoteId, voteCount, userId, voteType) =>
    set((state) => ({
    quotes: state.quotes.map(q =>
      q.id === quoteId
        ? {
            ...q,
            voteCount,
            votes: voteType
              ? [
                  ...q.votes.filter(v => v.userId !== userId),
                  { userId, type: voteType },
                ]
              : q.votes.filter(v => v.userId !== userId),
          }
        : q,
    ),
  })),
  addEmotionEvent: (event) => set((state) => {
    const emoji = (REACTION_META as Record<string, { emoji: string; label: string }>)[event.reactionType]?.emoji ?? '💬';
    
    // Create excerpt preview (first 40 chars)
    const content = state.paragraphContentMap[event.paragraphId] || '';
    const preview = content.length > 40 ? content.slice(0, 40) + '...' : content;

    const newEvent: EmotionEvent = {
      ...event,
      paragraphPreview: preview || 'đoạn này',
      id: `${event.userId}-${event.timestamp}-${Math.random().toString(36).slice(2, 7)}`,
      emoji,
    };
    const updated = [newEvent, ...state.emotionEvents];
    return { emotionEvents: updated.slice(0, 50) };
  }),
}));
