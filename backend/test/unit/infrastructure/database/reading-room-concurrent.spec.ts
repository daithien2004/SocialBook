import { JoinRoomUseCase } from '@/application/reading-rooms/use-cases/join-room/join-room.use-case';
import { JoinRoomCommand } from '@/application/reading-rooms/use-cases/join-room/join-room.command';
import { AddHighlightUseCase } from '@/application/reading-rooms/use-cases/add-highlight/add-highlight.use-case';
import { AddHighlightCommand } from '@/application/reading-rooms/use-cases/add-highlight/add-highlight.command';
import { ReadingRoomRepository } from '@/infrastructure/database/repositories/reading-rooms/reading-room.repository';

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

type AnyDoc = Record<string, any>;

function seedDoc(overrides: AnyDoc = {}): AnyDoc {
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
    chatMessages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: SEED_VERSION,
    ...overrides,
  };
}

function createFakeRoomModel(seed: AnyDoc) {
  const store: { doc: AnyDoc | null } = { doc: seed };

  const findById = jest.fn((_id: string) => ({
    lean: () => ({
      exec: async () => {
        await Promise.resolve();
        return store.doc ? structuredClone(store.doc) : null;
      },
    }),
  }));

  const updateOne = jest.fn((filter: AnyDoc, update: AnyDoc) => ({
    exec: async () => {
      await Promise.resolve();
      const doc = store.doc;
      if (!doc || doc._id !== filter._id || doc.version !== filter.version) {
        return { matchedCount: 0, modifiedCount: 0 };
      }
      store.doc = { ...doc, ...update.$set };
      return { matchedCount: 1, modifiedCount: 1 };
    },
  }));

  return { store, findById, updateOne };
}

describe('ReadingRoom OCC — thao tác song song (T2)', () => {
  it('10 user join song song → cả 10 trở thành thành viên, không user nào bị mất', async () => {
    const fake = createFakeRoomModel(seedDoc());
    const repository = new ReadingRoomRepository(fake as never);
    const joinRoom = new JoinRoomUseCase(repository);

    const joiners = Array.from(
      { length: 10 },
      (_, i) => `507f1f77bcf86cd7994391${i}`,
    );

    // Cùng một lúc: mỗi use-case nạp snapshot, sửa và ghi — bản ghi nào đến
    // muộn mà vẫn giữ version cũ phải ném ConcurrencyException rồi nạp lại.
    await Promise.all(
      joiners.map((userId) =>
        joinRoom.execute(new JoinRoomCommand(userId, ROOM_CODE)),
      ),
    );

    const members = fake.store.doc!.members as Array<{ userId: string }>;
    expect(members).toHaveLength(11); // host + 10 joiner
    expect(new Set(members.map((m) => m.userId)).size).toBe(11);
    // 10 lần ghi thật → version tăng đúng 10 (không ghi thừa, không ghi mất)
    expect(fake.store.doc!.version).toBe(SEED_VERSION + 10);
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
    const repository = new ReadingRoomRepository(fake as never);
    const addHighlight = new AddHighlightUseCase(repository);

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

    const highlights = fake.store.doc!.highlights as Array<{
      userId: string;
      content: string;
    }>;
    expect(highlights).toHaveLength(2);
    expect(highlights.map((h) => h.userId).sort()).toEqual(
      [HOST_ID, MEMBER_ID].sort(),
    );
    expect(fake.store.doc!.version).toBe(SEED_VERSION + 2);
  });
});
