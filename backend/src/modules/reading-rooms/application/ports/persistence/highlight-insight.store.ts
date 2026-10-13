import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';

export abstract class IHighlightInsightStore {
  abstract setIfEmpty(
    roomId: RoomId,
    highlightId: string,
    insight: string,
  ): Promise<boolean>;
}
