import { ForbiddenError } from '@casl/ability';
import type { Provider, Type } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ClsPluginTransactional,
  NoOpTransactionalAdapter,
} from '@nestjs-cls/transactional';
import { ClsModule } from 'nestjs-cls';
import { IAIPort } from '@/modules/ai';
import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { ReadingRoomForbiddenError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository';
import { HighlightInsightLockPort } from '@/modules/reading-rooms/application/ports/external/highlight-insight-lock.port';
import { HighlightInsightStore } from '@/modules/reading-rooms/application/ports/persistence/highlight-insight.store';
import { createReadingRoomActor } from '@/modules/reading-rooms/application/policies/reading-room.ability';
import { AddHighlightCommand } from '@/modules/reading-rooms/application/commands/add-highlight/add-highlight.command';
import { AddHighlightHandler } from '@/modules/reading-rooms/application/commands/add-highlight/add-highlight.handler';
import { GenerateHighlightInsightCommand } from '@/modules/reading-rooms/application/commands/generate-highlight-insight/generate-highlight-insight.command';
import { GenerateHighlightInsightHandler } from '@/modules/reading-rooms/application/commands/generate-highlight-insight/generate-highlight-insight.handler';
import { JoinRoomCommand } from '@/modules/reading-rooms/application/commands/join-room/join-room.command';
import { JoinRoomHandler } from '@/modules/reading-rooms/application/commands/join-room/join-room.handler';
import { LeaveRoomCommand } from '@/modules/reading-rooms/application/commands/leave-room/leave-room.command';
import { LeaveRoomHandler } from '@/modules/reading-rooms/application/commands/leave-room/leave-room.handler';
import { ReactivateRoomCommand } from '@/modules/reading-rooms/application/commands/reactivate-room/reactivate-room.command';
import { ReactivateRoomHandler } from '@/modules/reading-rooms/application/commands/reactivate-room/reactivate-room.handler';
import { RemoveHighlightCommand } from '@/modules/reading-rooms/application/commands/remove-highlight/remove-highlight.command';
import { RemoveHighlightHandler } from '@/modules/reading-rooms/application/commands/remove-highlight/remove-highlight.handler';

describe('Reading Room command handlers', () => {
  it('joins an active room and rejects joining an ended room', async () => {
    const room = createRoom();
    const repository = createRoomRepository(room);
    const moduleRef = await createTransactionalModule(JoinRoomHandler, [
      { provide: ReadingRoomRepository, useValue: repository },
    ]);
    const handler = moduleRef.get(JoinRoomHandler);
    const memberActor = createReadingRoomActor('member-1', 'user');

    await expect(
      handler.execute(new JoinRoomCommand(memberActor, room.roomId)),
    ).resolves.toBe(room.roomId);
    expect(repository.save).toHaveBeenCalledWith(room);

    room.end();
    await expect(
      handler.execute(new JoinRoomCommand(memberActor, room.roomId)),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await moduleRef.close();
  });

  it('leaves a room and treats a repeated leave as a no-op', async () => {
    const room = createRoom();
    room.addMember('member-1');
    const repository = createRoomRepository(room);
    const moduleRef = await createTransactionalModule(LeaveRoomHandler, [
      { provide: ReadingRoomRepository, useValue: repository },
    ]);
    const handler = moduleRef.get(LeaveRoomHandler);
    const command = new LeaveRoomCommand(
      createReadingRoomActor('member-1', 'user'),
      room.roomId,
    );

    await expect(handler.execute(command)).resolves.toBeUndefined();
    expect(room.isMember('member-1')).toBe(false);
    expect(repository.save).toHaveBeenCalledTimes(1);

    await expect(handler.execute(command)).resolves.toBeUndefined();
    expect(repository.save).toHaveBeenCalledTimes(1);
    await moduleRef.close();
  });

  it('requires the host policy to transfer room ownership while leaving', async () => {
    const room = createRoom();
    room.addMember('member-1');
    room.addMember('member-2');
    const repository = createRoomRepository(room);
    const moduleRef = await createTransactionalModule(LeaveRoomHandler, [
      { provide: ReadingRoomRepository, useValue: repository },
    ]);
    const handler = moduleRef.get(LeaveRoomHandler);

    await expect(
      handler.execute(
        new LeaveRoomCommand(
          createReadingRoomActor('member-1', 'user'),
          room.roomId,
          'member-2',
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(room.hostId).toBe('host-1');
    expect(room.isMember('member-1')).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();

    await expect(
      handler.execute(
        new LeaveRoomCommand(
          createReadingRoomActor('host-1', 'user'),
          room.roomId,
          'member-1',
        ),
      ),
    ).resolves.toBeUndefined();
    expect(room.hostId).toBe('member-1');
    expect(room.isMember('host-1')).toBe(false);
    expect(repository.save).toHaveBeenCalledTimes(1);
    await moduleRef.close();
  });

  it('reactivates a room for its host and rejects a non-host', async () => {
    const room = createRoom();
    room.end();
    const repository = createRoomRepository(room);
    const moduleRef = await createTransactionalModule(ReactivateRoomHandler, [
      { provide: ReadingRoomRepository, useValue: repository },
    ]);
    const handler = moduleRef.get(ReactivateRoomHandler);

    await expect(
      handler.execute(
        new ReactivateRoomCommand(
          createReadingRoomActor('host-1', 'user'),
          room.roomId,
        ),
      ),
    ).resolves.toBeUndefined();
    expect(room.status).toBe('active');
    expect(repository.save).toHaveBeenCalledTimes(1);

    await expect(
      handler.execute(
        new ReactivateRoomCommand(
          createReadingRoomActor('member-1', 'user'),
          room.roomId,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.save).toHaveBeenCalledTimes(1);
    await moduleRef.close();
  });

  it('adds a highlight for an active member and rejects a non-member', async () => {
    const room = createRoom();
    room.addMember('member-1');
    const repository = createRoomRepository(room);
    const moduleRef = await createTransactionalModule(AddHighlightHandler, [
      { provide: ReadingRoomRepository, useValue: repository },
    ]);
    const handler = moduleRef.get(AddHighlightHandler);
    const command = new AddHighlightCommand(
      room.roomId,
      createReadingRoomActor('member-1', 'user'),
      'chapter-one',
      'paragraph-1',
      'Highlighted passage',
    );

    const highlightId = await handler.execute(command);
    expect(room.highlights[0]?.id).toBe(highlightId);
    expect(repository.save).toHaveBeenCalledTimes(1);

    await expect(
      handler.execute(
        new AddHighlightCommand(
          room.roomId,
          createReadingRoomActor('outsider', 'user'),
          'chapter-one',
          'paragraph-2',
          'Another passage',
        ),
      ),
    ).rejects.toBeInstanceOf(ReadingRoomForbiddenError);
    expect(repository.save).toHaveBeenCalledTimes(1);
    await moduleRef.close();
  });

  it('removes an owned highlight and rejects removal by another user', async () => {
    const room = createRoom();
    const highlight = room.addHighlight({
      userId: 'host-1',
      chapterSlug: 'chapter-one',
      paragraphId: 'paragraph-1',
      content: 'Highlighted passage',
    });
    const repository = createRoomRepository(room);
    const moduleRef = await createTransactionalModule(RemoveHighlightHandler, [
      { provide: ReadingRoomRepository, useValue: repository },
    ]);
    const handler = moduleRef.get(RemoveHighlightHandler);

    await expect(
      handler.execute(
        new RemoveHighlightCommand(
          room.roomId,
          createReadingRoomActor('host-1', 'user'),
          highlight.id,
        ),
      ),
    ).resolves.toBeUndefined();
    expect(room.highlights).toHaveLength(0);

    const remaining = room.addHighlight({
      userId: 'host-1',
      chapterSlug: 'chapter-one',
      paragraphId: 'paragraph-2',
      content: 'Another highlighted passage',
    });
    await expect(
      handler.execute(
        new RemoveHighlightCommand(
          room.roomId,
          createReadingRoomActor('member-1', 'user'),
          remaining.id,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await moduleRef.close();
  });

  it('generates and stores an insight once, and rejects a non-member', async () => {
    const room = createRoom();
    const highlight = room.addHighlight({
      userId: 'host-1',
      chapterSlug: 'chapter-one',
      paragraphId: 'paragraph-1',
      content: 'Highlighted passage',
    });
    const repository = createRoomRepository(room);
    const setIfEmpty = jest.fn().mockResolvedValue(true);
    const tryAcquire = jest.fn().mockResolvedValue(true);
    const release = jest.fn().mockResolvedValue(undefined);
    const generateText = jest.fn().mockResolvedValue('Generated insight');
    const emit = jest.fn().mockReturnValue(true);
    const moduleRef = await createTransactionalModule(
      GenerateHighlightInsightHandler,
      [
        { provide: ReadingRoomRepository, useValue: repository },
        { provide: HighlightInsightStore, useValue: { setIfEmpty } },
        {
          provide: HighlightInsightLockPort,
          useValue: { tryAcquire, release },
        },
        { provide: QueryBus, useValue: { execute: jest.fn() } },
        { provide: IAIPort, useValue: { generateText } },
        { provide: EventEmitter2, useValue: { emit } },
      ],
    );
    const handler = moduleRef.get(GenerateHighlightInsightHandler);

    await expect(
      handler.execute(
        new GenerateHighlightInsightCommand(
          createReadingRoomActor('host-1', 'user'),
          room.roomId,
          highlight.id,
        ),
      ),
    ).resolves.toBeUndefined();
    expect(generateText).toHaveBeenCalledTimes(1);
    expect(setIfEmpty).toHaveBeenCalledWith(
      expect.anything(),
      highlight.id,
      'Generated insight',
    );
    expect(emit).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);

    await expect(
      handler.execute(
        new GenerateHighlightInsightCommand(
          createReadingRoomActor('outsider', 'user'),
          room.roomId,
          highlight.id,
        ),
      ),
    ).rejects.toBeInstanceOf(ReadingRoomForbiddenError);
    expect(generateText).toHaveBeenCalledTimes(1);
    await moduleRef.close();
  });
});

function createRoom(): ReadingRoom {
  return ReadingRoom.create({
    bookId: 'book-1',
    currentChapterId: 'chapter-1',
    hostId: 'host-1',
    mode: 'sync',
    currentChapterSlug: 'chapter-one',
  });
}

function createRoomRepository(room: ReadingRoom) {
  return {
    findById: jest.fn().mockResolvedValue(room),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

async function createTransactionalModule(
  handler: Type,
  providers: Provider[],
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ClsModule.forRoot({
        plugins: [
          new ClsPluginTransactional({
            adapter: new NoOpTransactionalAdapter({
              tx: {},
              disableWarning: true,
            }),
          }),
        ],
      }),
    ],
    providers: [handler, ...providers],
  }).compile();
}
