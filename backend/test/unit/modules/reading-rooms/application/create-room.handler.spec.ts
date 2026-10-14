import { Test } from '@nestjs/testing';
import { AbilityBuilder, ForbiddenError } from '@casl/ability';
import { createPrismaAbility } from '@casl/prisma/runtime';
import { ClsModule } from 'nestjs-cls';
import {
  ClsPluginTransactional,
  NoOpTransactionalAdapter,
} from '@nestjs-cls/transactional';
import {
  CreateRoomWriteCollision,
  CreateRoomStore,
} from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import type { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { CreateRoomCommand } from '@/modules/reading-rooms/application/commands/create-room/create-room.command';
import { CreateRoomHandler } from '@/modules/reading-rooms/application/commands/create-room/create-room.handler';
import { ReadingRoomNotFoundError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { createReadingRoomActor } from '@/modules/reading-rooms/application/policies/reading-room.ability';
import { CommandBus } from '@nestjs/cqrs';
import { TouchBookForReadingRoomCommand } from '@/modules/books';
import { TouchChapterForReadingRoomCommand } from '@/modules/chapters';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { Actor } from '@/shared/casl/actor';

describe('CreateRoomHandler', () => {
  const createHandler = async (chapterSlug: string | null) => {
    const createRoomStore = {
      findByRequestKey: jest.fn().mockResolvedValue(null),
      createIdempotently: jest.fn((room: ReadingRoom) =>
        Promise.resolve(room.roomId),
      ),
    };
    const commandBus = {
      execute: jest.fn((command: unknown) => {
        if (command instanceof TouchBookForReadingRoomCommand) {
          return Promise.resolve(true);
        }
        if (command instanceof TouchChapterForReadingRoomCommand) {
          return Promise.resolve(chapterSlug);
        }
        return Promise.resolve(undefined);
      }),
    };
    const moduleRef = await Test.createTestingModule({
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
      providers: [
        CreateRoomHandler,
        { provide: CreateRoomStore, useValue: createRoomStore },
        { provide: CommandBus, useValue: commandBus },
      ],
    }).compile();

    return {
      handler: moduleRef.get(CreateRoomHandler),
      moduleRef,
      createRoomStore,
      commandBus,
    };
  };

  const command = new CreateRoomCommand(
    createReadingRoomActor('host-1', 'user'),
    'book-1',
    'chapter-id-1',
    'sync',
    'request-key-123456',
  );

  it('starts the room at the chapter requested by the client', async () => {
    const { handler, moduleRef, createRoomStore, commandBus } =
      await createHandler('chapter-current-slug');

    const result = await handler.execute(command);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(TouchBookForReadingRoomCommand),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(TouchChapterForReadingRoomCommand),
    );
    expect(createRoomStore.createIdempotently).toHaveBeenCalledTimes(1);
    const storedRoom = createRoomStore.createIdempotently.mock.calls[0][0];
    expect(storedRoom.currentChapterId).toBe('chapter-id-1');
    expect(result).toBe(storedRoom.roomId);
    await moduleRef.close();
  });

  it('rejects a chapter that does not belong to the selected book', async () => {
    const { handler, moduleRef, createRoomStore } = await createHandler(null);

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ReadingRoomNotFoundError,
    );
    expect(createRoomStore.createIdempotently).not.toHaveBeenCalled();
    await moduleRef.close();
  });

  it('rejects a command when the actor lacks the create policy', async () => {
    const { handler, moduleRef, createRoomStore, commandBus } =
      await createHandler('chapter-current-slug');
    const deniedActor: Actor = {
      userId: 'host-1',
      roles: ['user'],
      ability: new AbilityBuilder<AppAbility>(createPrismaAbility).build(),
    };

    await expect(
      handler.execute(
        new CreateRoomCommand(
          deniedActor,
          command.bookId,
          command.chapterId,
          command.mode,
          command.idempotencyKey,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(createRoomStore.findByRequestKey).not.toHaveBeenCalled();
    expect(commandBus.execute).not.toHaveBeenCalled();
    await moduleRef.close();
  });

  it('retries an idempotency collision when the competing request is not visible', async () => {
    const { handler, moduleRef, createRoomStore } = await createHandler(
      'chapter-current-slug',
    );
    createRoomStore.createIdempotently.mockRejectedValueOnce(
      new CreateRoomWriteCollision('idempotency-key'),
    );

    const result = await handler.execute(command);
    expect(result).toBe(
      createRoomStore.createIdempotently.mock.calls[1][0].roomId,
    );
    expect(createRoomStore.findByRequestKey).toHaveBeenCalledTimes(2);
    expect(createRoomStore.createIdempotently).toHaveBeenCalledTimes(2);
    await moduleRef.close();
  });
});
