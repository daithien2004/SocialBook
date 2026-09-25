import { apiRequest } from '@/lib/api-client';
import type {
  ReactionType,
  RoomComment,
  RoomReactionEvent,
  RoomQuote,
} from '../types/room-interaction.types';

export interface AddReactionParams {
  roomId: string;
  chapterSlug: string;
  paragraphId: string;
  reactionType: ReactionType;
}

export async function addReaction(
  body: AddReactionParams,
): Promise<RoomReactionEvent> {
  return apiRequest<RoomReactionEvent>({
    url: `/reading-rooms/${body.roomId}/reactions`,
    method: 'POST',
    data: body,
  });
}

export async function getRoomQuotes(params: {
  code: string;
}): Promise<RoomQuote[]> {
  return apiRequest<RoomQuote[]>({
    url: `/reading-rooms/${params.code}/quotes`,
    method: 'GET',
  });
}

export async function getRoomComments(params: {
  code: string;
  chapterSlug?: string;
}): Promise<RoomComment[]> {
  return apiRequest<RoomComment[]>({
    url: `/reading-rooms/${params.code}/comments`,
    method: 'GET',
    params: { chapterSlug: params.chapterSlug },
  });
}

export async function getRoomReactions(params: {
  code: string;
  chapterSlug?: string;
}): Promise<RoomReactionEvent[]> {
  return apiRequest<RoomReactionEvent[]>({
    url: `/reading-rooms/${params.code}/reactions`,
    method: 'GET',
    params: { chapterSlug: params.chapterSlug },
  });
}

export async function deleteRoomQuote(params: {
  code: string;
  quoteId: string;
}): Promise<void> {
  return apiRequest<void>({
    url: `/reading-rooms/${params.code}/quotes/${params.quoteId}`,
    method: 'DELETE',
  });
}