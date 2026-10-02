import { create } from 'zustand';
import { RoomResponse } from '@/features/reading-rooms/api/reading-rooms.api';

export interface PresenceData {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  currentChapterSlug: string;
  paragraphId?: string | null;
  lastSeen?: number;
  progress?: number;
}

type Connection = 'idle' | 'connecting' | 'joining' | 'joined' | 'reconnecting' | 'error';

const EMPTY: readonly string[] = Object.freeze([]);
const keyOf = (p: Pick<PresenceData, 'currentChapterSlug' | 'paragraphId'>) =>
  p.paragraphId ? `${p.currentChapterSlug}:${p.paragraphId}` : null;

const samePresence = (a: PresenceData, b: PresenceData) =>
  a.displayName === b.displayName &&
  a.avatarUrl === b.avatarUrl &&
  a.currentChapterSlug === b.currentChapterSlug &&
  a.paragraphId === b.paragraphId &&
  a.progress === b.progress;

export interface RoomHighlight {
  id: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
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



interface ReadingRoomState {
  connection: Connection;
  errorCode: string | null;
  room: RoomResponse | null;
  members: { userId: string; role: string }[];
  presences: Record<string, PresenceData>;
  byParagraph: Record<string, readonly string[]>;
  highlights: RoomHighlight[];
  setRoom: (room: RoomResponse) => void;
  setConnection: (c: Connection, errorCode?: string | null) => void;
  hydrate: (snapshot: { presences: PresenceData[] }) => void;

  setMembers: (members: { userId: string; role: string }[]) => void;
  addMember: (userId: string) => void;
  removeMember: (userId: string) => void;
  updatePresences: (presences: PresenceData[]) => void;
  updateChapter: (chapterSlug: string) => void;
  setHighlights: (highlights: RoomHighlight[]) => void;
  addHighlight: (highlight: RoomHighlight) => void;
  removeHighlight: (id: string) => void;
  updateHighlightInsight: (id: string, insight: string) => void;
  clearRoom: () => void;
}

export const selectUsersAtParagraph = (chapterSlug: string, paragraphId: string) =>
  (s: ReadingRoomState) => s.byParagraph[`${chapterSlug}:${paragraphId}`] ?? EMPTY;

export const useReadingRoomStore = create<ReadingRoomState>((set, get) => ({
  connection: 'idle',
  errorCode: null,
  room: null,
  members: [],
  presences: {},
  byParagraph: {},
  highlights: [],

  setRoom: (room) => set({
    room,
    highlights: room.highlights || [],
  }),

  setConnection: (connection, errorCode = null) =>
    set((s) => (s.connection === connection && s.errorCode === errorCode ? s : { connection, errorCode })),

  hydrate: (snapshot) => get().updatePresences(snapshot.presences),

  setMembers: (members) => set({ members }),
  addMember: (userId) => set((state) => ({
    members: state.members.some(m => m.userId === userId)
      ? state.members
      : [...state.members, { userId, role: 'member' }],
  })),
  removeMember: (userId) => set((state) => ({
    members: state.members.filter(m => m.userId !== userId),
  })),
  updatePresences: (list) => set((state) => {
    const next: Record<string, PresenceData> = {};
    let changed = Object.keys(state.presences).length !== list.length;

    for (const p of list) {
      const prev = state.presences[p.userId];
      if (prev && samePresence(prev, p)) {
        next[p.userId] = prev;
      } else {
        next[p.userId] = p;
        changed = true;
      }
    }
    if (!changed) return state;

    const grouped: Record<string, string[]> = {};
    for (const p of Object.values(next)) {
      const k = keyOf(p);
      if (k) (grouped[k] ??= []).push(p.userId);
    }
    const byParagraph: Record<string, readonly string[]> = {};
    for (const [k, ids] of Object.entries(grouped)) {
      ids.sort();
      const old = state.byParagraph[k];
      byParagraph[k] = old && old.length === ids.length && old.every((v, i) => v === ids[i]) ? old : ids;
    }
    return { presences: next, byParagraph };
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
  clearRoom: () => set({
    connection: 'idle',
    errorCode: null,
    room: null,
    members: [],
    presences: {},
    byParagraph: {},
    highlights: [],
  }),
}));
