import { create } from 'zustand';
import { RoomResponse } from '@/features/reading-rooms/api/readingRoomsApi';
import type { RoomComment, ReactionType, ParagraphReactionSummary, RoomQuote } from '@/features/reading-room-interactions/types/room-interaction.types';

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
  updateQuoteVote: (quoteId: string, voteCount: number, userId: string, voteType: 'up' | 'down' | null) => void;
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
  }),

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
  addQuote: (quote) => set((state) => ({
    quotes: [quote, ...state.quotes],
  })),
  updateQuoteVote: (quoteId, voteCount, userId, voteType) => set((state) => ({
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
}));
