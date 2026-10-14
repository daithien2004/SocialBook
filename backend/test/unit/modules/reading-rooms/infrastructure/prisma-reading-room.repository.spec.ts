import { Prisma } from '@/core/database/generated/prisma/client';
import { isRoomIdCollision } from '@/modules/reading-rooms/infrastructure/persistence/prisma-reading-room.repository';

describe('isRoomIdCollision', () => {
  it('recognizes a duplicate room primary key', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique violation', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['id'] },
    });

    expect(isRoomIdCollision(error)).toBe(true);
  });

  it('does not classify another unique constraint as a room code collision', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique violation', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['hostId', 'createRequestKey'] },
    });

    expect(isRoomIdCollision(error)).toBe(false);
  });

  it('does not classify a non-unique Prisma error as a room code collision', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Missing record', {
      code: 'P2025',
      clientVersion: 'test',
    });

    expect(isRoomIdCollision(error)).toBe(false);
  });
});
