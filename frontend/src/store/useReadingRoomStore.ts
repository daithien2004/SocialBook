import { create } from 'zustand';
import { RoomResponse } from '@/features/reading-rooms/api/readingRoomsApi';

export interface PresenceData {
  userId: string;
  displayName: string;
  avatarUrl: string;
  currentChapterSlug: string;
  paragraphId?: string;
  lastSeen: number;
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
  updateHighlightInsight: (id: string, insight: string) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearRoom: () => void;
}

export const useReadingRoomStore = create<ReadingRoomState>((set) => ({
  room: null,
  members: [],
  presences: {},
  annotations: {},
  highlights: [],
  chatMessages: [],
  setRoom: (room) => set({ 
    room, 
    highlights: room.highlights || [],
    chatMessages: room.chatMessages || []
  }),



  setMembers: (members) => set({ members }),
  addMember: (userId) => set((state) => ({
    members: state.members.some(m => m.userId === userId) 
      ? state.members 
      : [...state.members, { userId, role: 'member' }]
  })),
  removeMember: (userId) => set((state) => ({
    members: state.members.filter(m => m.userId !== userId)
  })),
  updatePresences: (presencesList) => set((state) => {
    const presencesMap: Record<string, PresenceData> = {};
    presencesList.forEach(p => {
      presencesMap[p.userId] = p;
    });
    return { presences: presencesMap };
  }),
  updateAnnotation: (paragraphId, count) => set((state) => ({
    annotations: { ...state.annotations, [paragraphId]: count }
  })),
  removeAnnotation: (paragraphId) => set((state) => {
    const newAnnotations = { ...state.annotations };
    delete newAnnotations[paragraphId];
    return { annotations: newAnnotations };
  }),
  updateChapter: (chapterSlug) => set((state) => ({
    room: state.room ? { ...state.room, currentChapterSlug: chapterSlug } : null
  })),
  setHighlights: (highlights) => set({ highlights }),
  addHighlight: (highlight) => set((state) => ({
    highlights: state.highlights.some(h => h.id === highlight.id)
      ? state.highlights
      : [...state.highlights, highlight]
  })),
  updateHighlightInsight: (id, insight) => set((state) => ({
    highlights: state.highlights.map(h => h.id === id ? { ...h, aiInsight: insight } : h)
  })),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),
  clearRoom: () => set({ room: null, members: [], presences: {}, annotations: {}, highlights: [], chatMessages: [] }),
}));


