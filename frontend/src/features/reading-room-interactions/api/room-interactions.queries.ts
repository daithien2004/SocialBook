import { roomInteractionKeys } from '@/lib/query-keys';
import {
  getRoomComments,
  getRoomQuotes,
  getRoomReactions,
} from './room-interactions.api';
import type {
  RoomComment,
  RoomQuote,
  RoomReactionEvent,
} from '../types/room-interaction.types';

export const roomInteractionQueries = {
  quotes: ({ code }: { code: string }) => ({
    queryKey: roomInteractionKeys.quotes(code),
    queryFn: (): Promise<RoomQuote[]> => getRoomQuotes({ code }),
  }),
  comments: ({ code, chapterSlug }: { code: string; chapterSlug?: string }) => ({
    queryKey: roomInteractionKeys.comments(code, chapterSlug),
    queryFn: (): Promise<RoomComment[]> => getRoomComments({ code, chapterSlug }),
  }),
  reactions: ({ code, chapterSlug }: { code: string; chapterSlug?: string }) => ({
    queryKey: roomInteractionKeys.reactions(code, chapterSlug),
    queryFn: (): Promise<RoomReactionEvent[]> =>
      getRoomReactions({ code, chapterSlug }),
  }),
};