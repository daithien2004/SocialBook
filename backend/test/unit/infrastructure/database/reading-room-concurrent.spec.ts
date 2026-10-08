import { describe, expect, it, jest } from '@jest/globals';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { JoinRoomHandler } from '@/modules/reading-rooms/application/commands/join-room/join-room.handler';
import { JoinRoomCommand } from '@/modules/reading-rooms/application/commands/join-room/join-room.command';
import { AddHighlightHandler } from '@/modules/reading-rooms/application/commands/add-highlight/add-highlight.handler';
import { AddHighlightCommand } from '@/modules/reading-rooms/application/commands/add-highlight/add-highlight.command';
import { ReadingRoomRepository } from '@/modules/reading-rooms/infrastructure/mongo/repositories/reading-room.repository';
import { ReadingRoom as ReadingRoomSchema } from '@/modules/reading-rooms/infrastructure/mongo/schemas/reading-room.schema';

/**
 * T2 — test SONG SONG (không phải đường vui): 10 user join cùng lúc và 2 user
 * add_highlight cùng lúc, đi qua đúng use-case + repository sản phẩm.
 *
 * Model giả tái hiện đúng ngữ nghĩa OCC của MongoDB: `updateOne` chỉ ghi khi
 * `version` trong filter khớp phiên bản đang lưu — đúng điều kiện mà
 * `ReadingRoomRepository.save` dùng để chống ghi đè (lost update).
 */

const ROOM_CODE = 'ABCDEF';
const HOST_ID = '507f1f77bcf86cd799439001';
const MEMBER_ID = '507f1f77bcf86cd799439002';
const SEED_VERSION = 3;

interface RoomMemberDocument {
  userId: string;
  role: 'host' | 'member';
  joinedAt: Date;
  leftAt?: Date;
}

interface HighlightDocument {
  id: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  chapterSlug: string;
  paragraphId: string;
  content: string;
  aiInsight?: string;
  createdAt: Date;
}

interface RoomDocument {
  _id: string;
  bookId: string;
  hostId: string;
  mode: string;
  status: 'active' | 'ended';
  currentChapterSlug: string;
  maxMembers: number;
  members: RoomMemberDocument[];
  highlights: HighlightDocument[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface RoomUpdate {
  $set: Partial<RoomDocument>;
}

function seedDoc(overrides: Partial<RoomDocument> = {}): RoomDocument {
  return {
    _id: ROOM_CODE,
    bookId: '507f1f77bcf86cd799439011',
    hostId: HOST_ID,
    mode: 'sync',
    status: 'active',
    currentChapterSlug: 'chapter-1',
    maxMembers: 20,
    members: [{ userId: HOST_ID, role: 'host', joinedAt: new Date() }],
    highlights: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: SEED_VERSION,
    ...overrides,
  };
}

function createFakeRoomModel(seed: RoomDocument) {
  const store: { doc: RoomDocument | null } = { doc: seed };

  const findById = jest.fn((_id: string) => ({
    lean: () => ({
      exec: () =>
        Promise.resolve(store.doc ? structuredClone(store.doc) : null),
    }),
  }));

  const updateOne = jest.fn(
    (filter: { _id: string; version: number }, update: RoomUpdate) => ({
      exec: () => {
        const doc = store.doc;
        if (!doc || doc._id !== filter._id || doc.version !== filter.version) {
          return Promise.resolve({ matchedCount: 0, modifiedCount: 0 });
        }
        store.doc = { ...doc, ...update.$set };
        return Promise.resolve({ matchedCount: 1, modifiedCount: 1 });
      },
    }),
  );

  return { store, findById, updateOne, create: jest.fn() };
}

async function createRepositoryModule(
  model: ReturnType<typeof createFakeRoomModel>,
): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [
      ReadingRoomRepository,
      {
        provide: getModelToken(ReadingRoomSchema.name),
        useValue: model,
      },
    ],
  }).compile();
}

function requireStoredRoom(document: RoomDocument | null): RoomDocument {
  if (!document) {
    throw new Error('Expected the fake Mongo model to contain a room.');
  }
  return document;
}

describe('ReadingRoom OCC — thao tác song song (T2)', () => {
  it('10 user join song song → cả 10 trở thành thành viên, không user nào bị mất', async () => {
    const fake = createFakeRoomModel(seedDoc());
    const moduleRef = await createRepositoryModule(fake);
    const repository = moduleRef.get(ReadingRoomRepository);
    const joinRoom = new JoinRoomHandler(repository);

    const joiners = Array.from(
      { length: 10 },
      (_, i) => `507f1f77bcf86cd7994391${i}`,
    );

    // Cùng một lúc: mỗi use-case nạp snapshot, sửa và ghi — bản ghi nào đến
    // muộn mà vẫn giữ version cũ phải ném ConcurrencyException rồi nạp lại.
    try {
      await Promise.all(
        joiners.map((userId) =>
          joinRoom.execute(new JoinRoomCommand(userId, ROOM_CODE)),
        ),
      );

      const storedRoom = requireStoredRoom(fake.store.doc);
      expect(storedRoom.members).toHaveLength(11); // host + 10 joiner
      expect(
        new Set(storedRoom.members.map((member) => member.userId)).size,
      ).toBe(11);
      expect(storedRoom.version).toBe(SEED_VERSION + 10);
    } finally {
      await moduleRef.close();
    }
  });

  it('2 add_highlight song song → cả 2 highlight tồn tại, không cái nào bị ghi đè', async () => {
    const fake = createFakeRoomModel(
      seedDoc({
        members: [
          { userId: HOST_ID, role: 'host', joinedAt: new Date() },
          { userId: MEMBER_ID, role: 'member', joinedAt: new Date() },
        ],
      }),
    );
    const moduleRef = await createRepositoryModule(fake);
    const repository = moduleRef.get(ReadingRoomRepository);
    const addHighlight = new AddHighlightHandler(repository);

    try {
      await Promise.all([
        addHighlight.execute(
          new AddHighlightCommand(
            ROOM_CODE,
            HOST_ID,
            'chapter-1',
            'p-1',
            'Highlight của host',
          ),
        ),
        addHighlight.execute(
          new AddHighlightCommand(
            ROOM_CODE,
            MEMBER_ID,
            'chapter-1',
            'p-2',
            'Highlight của thành viên',
          ),
        ),
      ]);

      const storedRoom = requireStoredRoom(fake.store.doc);
      expect(storedRoom.highlights).toHaveLength(2);
      expect(
        storedRoom.highlights.map((highlight) => highlight.userId).sort(),
      ).toEqual([HOST_ID, MEMBER_ID].sort());
      expect(storedRoom.version).toBe(SEED_VERSION + 2);
    } finally {
      await moduleRef.close();
    }
  });
});
