import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';
import { ReadingRoomRepository } from '@/infrastructure/database/repositories/reading-rooms/reading-room.repository';
import { ConcurrencyException } from '@/shared/domain/common-exceptions';
import { withOptimisticRetry } from '@/application/shared/utils/with-retries.util';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';

describe('ReadingRoom Optimistic Concurrency Control (T2)', () => {
  describe('Entity OCC State & Mutations', () => {
    it('sets isNew=true and loadedVersion=0 for newly created room', () => {
      const room = ReadingRoom.create({
        bookId: '507f1f77bcf86cd799439011',
        hostId: '507f1f77bcf86cd799439012',
        mode: 'sync',
        currentChapterSlug: 'chapter-1',
      });

      expect(room.isNew).toBe(true);
      expect(room.loadedVersion).toBe(0);
      expect(room.version).toBe(0);
      expect(room.isDirty).toBe(false);
    });

    it('sets isNew=false and loadedVersion=props.version for reconstituted room', () => {
      const room = ReadingRoom.reconstitute({
        id: 'ABCDEF',
        bookId: '507f1f77bcf86cd799439011',
        hostId: '507f1f77bcf86cd799439012',
        mode: 'sync',
        status: 'active',
        currentChapterSlug: 'chapter-1',
        maxMembers: 10,
        members: [
          { userId: '507f1f77bcf86cd799439012', role: 'host', joinedAt: new Date() },
        ],
        highlights: [],
        chatMessages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 5,
      });

      expect(room.isNew).toBe(false);
      expect(room.loadedVersion).toBe(5);
      expect(room.version).toBe(5);
      expect(room.isDirty).toBe(false);
    });

    it('does NOT mark room dirty when an existing active user rejoins', () => {
      const room = ReadingRoom.reconstitute({
        id: 'ABCDEF',
        bookId: '507f1f77bcf86cd799439011',
        hostId: '507f1f77bcf86cd799439012',
        mode: 'sync',
        status: 'active',
        currentChapterSlug: 'chapter-1',
        maxMembers: 10,
        members: [
          { userId: '507f1f77bcf86cd799439012', role: 'host', joinedAt: new Date() },
        ],
        highlights: [],
        chatMessages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 2,
      });

      // User 507f1f77bcf86cd799439012 is already active
      room.addMember('507f1f77bcf86cd799439012');

      expect(room.isDirty).toBe(false);
      expect(room.loadedVersion).toBe(2);
    });

    it('keeps loadedVersion intact even when multiple mutating operations occur on aggregate', () => {
      const room = ReadingRoom.reconstitute({
        id: 'ABCDEF',
        bookId: '507f1f77bcf86cd799439011',
        hostId: '507f1f77bcf86cd799439012',
        mode: 'sync',
        status: 'active',
        currentChapterSlug: 'chapter-1',
        maxMembers: 10,
        members: [
          { userId: '507f1f77bcf86cd799439012', role: 'host', joinedAt: new Date(1000) },
          { userId: '507f1f77bcf86cd799439013', role: 'member', joinedAt: new Date(2000) },
        ],
        highlights: [],
        chatMessages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 3,
      });

      // Host transfers host, then leaves
      room.transferHost('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013');
      room.removeMember('507f1f77bcf86cd799439012');

      expect(room.isDirty).toBe(true);
      // Entity version must NOT increment internally multiple times
      expect(room.loadedVersion).toBe(3);
      expect(room.hostId).toBe('507f1f77bcf86cd799439013');

      // After repository marks persisted
      room.markPersisted();
      expect(room.isDirty).toBe(false);
      expect(room.loadedVersion).toBe(4);
      expect(room.isNew).toBe(false);
    });

    it('sole host leaves -> ends room and remains at loadedVersion until persisted', () => {
      const room = ReadingRoom.reconstitute({
        id: 'ABCDEF',
        bookId: '507f1f77bcf86cd799439011',
        hostId: '507f1f77bcf86cd799439012',
        mode: 'sync',
        status: 'active',
        currentChapterSlug: 'chapter-1',
        maxMembers: 10,
        members: [
          { userId: '507f1f77bcf86cd799439012', role: 'host', joinedAt: new Date() },
        ],
        highlights: [],
        chatMessages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      room.removeMember('507f1f77bcf86cd799439012');

      expect(room.status).toBe('ended');
      expect(room.isDirty).toBe(true);
      expect(room.loadedVersion).toBe(1);

      room.markPersisted();
      expect(room.loadedVersion).toBe(2);
      expect(room.isDirty).toBe(false);
    });
  });

  describe('Repository save OCC behavior', () => {
    let mockRoomModel: {
      create: jest.Mock;
      updateOne: jest.Mock;
    };
    let repository: ReadingRoomRepository;

    beforeEach(() => {
      mockRoomModel = {
        create: jest.fn(),
        updateOne: jest.fn(),
      };
      // @ts-expect-error Mock Model injection
      repository = new ReadingRoomRepository(mockRoomModel);
    });

    it('skips database update when room is not dirty', async () => {
      const room = ReadingRoom.reconstitute({
        id: 'ABCDEF',
        bookId: '507f1f77bcf86cd799439011',
        hostId: '507f1f77bcf86cd799439012',
        mode: 'sync',
        status: 'active',
        currentChapterSlug: 'chapter-1',
        maxMembers: 10,
        members: [
          { userId: '507f1f77bcf86cd799439012', role: 'host', joinedAt: new Date() },
        ],
        highlights: [],
        chatMessages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 2,
      });

      await repository.save(room);

      expect(mockRoomModel.create).not.toHaveBeenCalled();
      expect(mockRoomModel.updateOne).not.toHaveBeenCalled();
    });

    it('writes with loadedVersion and increments version by 1 in database', async () => {
      const room = ReadingRoom.reconstitute({
        id: 'ABCDEF',
        bookId: '507f1f77bcf86cd799439011',
        hostId: '507f1f77bcf86cd799439012',
        mode: 'sync',
        status: 'active',
        currentChapterSlug: 'chapter-1',
        maxMembers: 10,
        members: [
          { userId: '507f1f77bcf86cd799439012', role: 'host', joinedAt: new Date() },
        ],
        highlights: [],
        chatMessages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 2,
      });

      room.addMember('507f1f77bcf86cd799439099');

      mockRoomModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
      });

      await repository.save(room);

      expect(mockRoomModel.updateOne).toHaveBeenCalledWith(
        { _id: 'ABCDEF', version: 2 },
        expect.objectContaining({
          $set: expect.objectContaining({
            version: 3,
          }),
        }),
      );
      expect(room.loadedVersion).toBe(3);
      expect(room.isDirty).toBe(false);
    });

    it('throws ConcurrencyException when matchedCount === 0 (concurrent collision)', async () => {
      const room = ReadingRoom.reconstitute({
        id: 'ABCDEF',
        bookId: '507f1f77bcf86cd799439011',
        hostId: '507f1f77bcf86cd799439012',
        mode: 'sync',
        status: 'active',
        currentChapterSlug: 'chapter-1',
        maxMembers: 10,
        members: [
          { userId: '507f1f77bcf86cd799439012', role: 'host', joinedAt: new Date() },
        ],
        highlights: [],
        chatMessages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 2,
      });

      room.addMember('507f1f77bcf86cd799439099');

      mockRoomModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ matchedCount: 0, modifiedCount: 0 }),
      });

      await expect(repository.save(room)).rejects.toThrow(ConcurrencyException);
      // loadedVersion must not change when save fails
      expect(room.loadedVersion).toBe(2);
      expect(room.isDirty).toBe(true);
    });
  });

  describe('withOptimisticRetry concurrency handling', () => {
    it('retries on ConcurrencyException and succeeds when second attempt passes', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts === 1) {
          throw new ConcurrencyException('Conflict on attempt 1');
        }
        return 'success';
      });

      const result = await withOptimisticRetry(fn, 3);
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('throws ConcurrencyException after exceeding max attempts', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        throw new ConcurrencyException('Persistent conflict');
      });

      await expect(withOptimisticRetry(fn, 3)).rejects.toThrow(ConcurrencyException);
      expect(attempts).toBe(3);
    });

    it('handles simulated concurrent operations with retry', async () => {
      let globalDbVersion = 0;
      const concurrentUsers = ['user-1', 'user-2', 'user-3', 'user-4'];

      const runConcurrentJoin = async (userId: string) => {
        return withOptimisticRetry(async () => {
          // Read state
          const readVersion = globalDbVersion;
          // Simulate latency
          await new Promise((r) => setTimeout(r, Math.random() * 20));
          // Check collision on write
          if (readVersion !== globalDbVersion) {
            throw new ConcurrencyException('Conflict detected');
          }
          // Increment atomic version in DB
          globalDbVersion++;
          return `${userId} joined at version ${globalDbVersion}`;
        }, 5);
      };

      const results = await Promise.all(
        concurrentUsers.map((u) => runConcurrentJoin(u)),
      );

      expect(results).toHaveLength(4);
      expect(globalDbVersion).toBe(4);
    });
  });
});
