import type { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';

export interface CreateRoomRequestRecord {
  roomId: string;
  fingerprint: string;
}

export class CreateRoomWriteCollision extends Error {
  constructor(public readonly kind: 'room-code' | 'idempotency-key') {
    super(`Reading room create collision: ${kind}`);
  }
}

export abstract class CreateRoomStore {
  abstract findByRequestKey(
    hostId: string,
    idempotencyKey: string,
  ): Promise<CreateRoomRequestRecord | null>;

  abstract createIdempotently(
    room: ReadingRoom,
    idempotencyKey: string,
    fingerprint: string,
  ): Promise<string>;
}
