import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';

export abstract class HighlightInsightStore {
  abstract setIfEmpty(
    roomId: RoomId,
    highlightId: string,
    insight: string,
  ): Promise<boolean>;
}
