import { Test } from '@nestjs/testing';
import {
  CreateRoomWriteCollision,
  ICreateRoomStore,
} from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import type { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { CreateRoomCommand } from '@/modules/reading-rooms/application/commands/create-room/create-room.command';
import { CreateRoomHandler } from '@/modules/reading-rooms/application/commands/create-room/create-room.handler';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { IBookRepository, BookId } from '@/modules/books/domain/public-api';
import {
  IChapterRepository,
  BookId as ChapterBookId,
  ChapterId,
} from '@/modules/chapters/domain/public-api';

describe('CreateRoomHandler', () => {
  const createHandler = async (chapterSlug: string | null) => {
    const createRoomStore = {
      findByRequestKey: jest.fn().mockResolvedValue(null),
      createIdempotently: jest.fn((room: ReadingRoom) =>
        Promise.resolve({ kind: 'created' as const, room }),
      ),
    };
    const bookRepository = {
      touchIfActive: jest.fn().mockResolvedValue(true),
    };
    const chapterRepository = {
      touchIfInBook: jest.fn().mockResolvedValue(chapterSlug),
    };
    const unitOfWork = {
      execute: jest.fn(<T>(operation: () => Promise<T>) => operation()),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateRoomHandler,
        { provide: ICreateRoomStore, useValue: createRoomStore },
        { provide: IBookRepository, useValue: bookRepository },
        { provide: IChapterRepository, useValue: chapterRepository },
        { provide: UnitOfWorkPort, useValue: unitOfWork },
      ],
    }).compile();

    return {
      handler: moduleRef.get(CreateRoomHandler),
      moduleRef,
      createRoomStore,
      bookRepository,
      chapterRepository,
    };
  };

  const command = new CreateRoomCommand(
    'host-1',
    'book-1',
    'chapter-id-1',
    'sync',
    'request-key-123456',
  );

  it('starts the room at the chapter requested by the client', async () => {
    const {
      handler,
      moduleRef,
      createRoomStore,
      bookRepository,
      chapterRepository,
    } = await createHandler('chapter-current-slug');

    const result = await handler.execute(command);

    expect(bookRepository.touchIfActive).toHaveBeenCalledWith(
      BookId.create('book-1'),
    );
    expect(chapterRepository.touchIfInBook).toHaveBeenCalledWith(
      ChapterId.create('chapter-id-1'),
      ChapterBookId.create('book-1'),
    );
    expect(createRoomStore.createIdempotently).toHaveBeenCalledTimes(1);
    const storedRoom = createRoomStore.createIdempotently.mock.calls[0][0];
    expect(storedRoom.currentChapterId).toBe('chapter-id-1');
    expect(result.currentChapterSlug).toBe('chapter-current-slug');
    await moduleRef.close();
  });

  it('rejects a chapter that does not belong to the selected book', async () => {
    const { handler, moduleRef, createRoomStore } = await createHandler(null);

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundDomainException,
    );
    expect(createRoomStore.createIdempotently).not.toHaveBeenCalled();
    await moduleRef.close();
  });

  it('retries an idempotency collision when the competing request is not visible', async () => {
    const { handler, moduleRef, createRoomStore } = await createHandler(
      'chapter-current-slug',
    );
    createRoomStore.createIdempotently.mockRejectedValueOnce(
      new CreateRoomWriteCollision('idempotency-key'),
    );

    await expect(handler.execute(command)).resolves.toMatchObject({
      currentChapterSlug: 'chapter-current-slug',
    });
    expect(createRoomStore.findByRequestKey).toHaveBeenCalledTimes(2);
    expect(createRoomStore.createIdempotently).toHaveBeenCalledTimes(2);
    await moduleRef.close();
  });
});
