import { Test } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import {
  ClsPluginTransactional,
  NoOpTransactionalAdapter,
} from '@nestjs-cls/transactional';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { Chapter } from '@/modules/chapters/domain/chapters/entities/chapter.entity';
import { IChapterRepository } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { DeleteChapterCommand } from '@/modules/chapters/application/chapters/commands/delete-chapter/delete-chapter.command';
import { DeleteChapterHandler } from '@/modules/chapters/application/chapters/commands/delete-chapter/delete-chapter.handler';
import { UpdateChapterCommand } from '@/modules/chapters/application/chapters/commands/update-chapter/update-chapter.command';
import { UpdateChapterHandler } from '@/modules/chapters/application/chapters/commands/update-chapter/update-chapter.handler';
import { ReadingRoomReferencePort } from '@/modules/reading-rooms';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineChapterAbilities } from '@/modules/chapters/application/policies/chapter.ability';

const actor = new AbilityFactory([defineChapterAbilities]).createActor({
  userId: 'admin-user',
  roles: ['admin'],
});

const chapter = Chapter.reconstitute({
  id: '00000000-0000-4000-8000-000000000015',
  title: 'Chapter title',
  slug: 'chapter-title',
  bookId: '00000000-0000-4000-8000-000000000011',
  paragraphs: [{ id: '00000000-0000-4000-8000-000000000016', content: 'Text' }],
  viewsCount: 0,
  orderIndex: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  version: 3,
});

describe('chapter mutations while a reading room uses the chapter', () => {
  it('does not delete a chapter referenced by an active room', async () => {
    const deleteChapter = jest.fn(() => Promise.resolve());
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
        DeleteChapterHandler,
        {
          provide: IChapterRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue(chapter),
            delete: deleteChapter,
          },
        },
        {
          provide: ReadingRoomReferencePort,
          useValue: {
            hasActiveRoomForChapter: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    await expect(
      moduleRef
        .get(DeleteChapterHandler)
        .execute(new DeleteChapterCommand(actor, chapter.id.toString())),
    ).rejects.toBeInstanceOf(ConflictDomainException);
    expect(deleteChapter).not.toHaveBeenCalled();
    await moduleRef.close();
  });

  it('does not move a chapter referenced by an active room to another book', async () => {
    const saveChapter = jest.fn(() => Promise.resolve());
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
        UpdateChapterHandler,
        {
          provide: IChapterRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue(chapter),
            save: saveChapter,
            existsByTitle: jest.fn().mockResolvedValue(false),
            existsByOrderIndex: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: ReadingRoomReferencePort,
          useValue: {
            hasActiveRoomForChapter: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    await expect(
      moduleRef.get(UpdateChapterHandler).execute(
        new UpdateChapterCommand({
          actor,
          id: chapter.id.toString(),
          bookId: '00000000-0000-4000-8000-000000000020',
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictDomainException);
    expect(saveChapter).not.toHaveBeenCalled();
    await moduleRef.close();
  });
});
