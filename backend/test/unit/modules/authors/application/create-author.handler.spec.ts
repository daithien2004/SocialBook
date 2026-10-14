import { Test } from '@nestjs/testing';
import { AbilityBuilder, ForbiddenError } from '@casl/ability';
import { createPrismaAbility } from '@casl/prisma/runtime';
import { ClsModule } from 'nestjs-cls';
import {
  ClsPluginTransactional,
  NoOpTransactionalAdapter,
} from '@nestjs-cls/transactional';
import { CreateAuthorCommand } from '@/modules/authors/application/commands/create-author/create-author.command';
import { CreateAuthorHandler } from '@/modules/authors/application/commands/create-author/create-author.handler';
import { AuthorRepository } from '@/modules/authors/domain/repositories/author.repository';
import { Author } from '@/modules/authors/domain/entities/author.entity';
import { AuthorName } from '@/modules/authors/domain/value-objects/author-name.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { IMediaPort } from '@/modules/media/domain/public-api';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineAuthorAbilities } from '@/modules/authors/application/policies/author.ability';
import { Actor } from '@/shared/casl/actor';
import { AppAbility } from '@/shared/casl/app-ability';
import { MediaUploadFile } from '@/modules/media/domain/public-api';

describe('CreateAuthorHandler', () => {
  const createHandler = async () => {
    const authorRepository = {
      existsByName: jest
        .fn<Promise<boolean>, [name: AuthorName]>()
        .mockResolvedValue(false),
      save: jest
        .fn<Promise<void>, [author: Author]>()
        .mockResolvedValue(undefined),
    };
    const idGenerator = {
      generate: jest.fn<string, []>().mockReturnValue('author-1'),
    };
    const media = {
      uploadImage: jest
        .fn<Promise<string>, [file: MediaUploadFile]>()
        .mockResolvedValue('https://cdn.example/author-1'),
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
        CreateAuthorHandler,
        { provide: AuthorRepository, useValue: authorRepository },
        { provide: IIdGenerator, useValue: idGenerator },
        { provide: IMediaPort, useValue: media },
      ],
    }).compile();

    return {
      handler: moduleRef.get(CreateAuthorHandler),
      moduleRef,
      authorRepository,
      media,
    };
  };

  const adminActor = new AbilityFactory([defineAuthorAbilities]).createActor({
    userId: 'admin-1',
    roles: ['admin'],
  });

  const photo: MediaUploadFile = {
    buffer: Buffer.from('image'),
    originalname: 'author.png',
    mimetype: 'image/png',
  };

  it('uploads the photo and saves the aggregate', async () => {
    const { handler, moduleRef, authorRepository, media } =
      await createHandler();

    const result = await handler.execute(
      new CreateAuthorCommand(
        adminActor,
        'Nguyen Van A',
        'Bio',
        undefined,
        photo,
      ),
    );

    expect(result).toBe('author-1');
    expect(media.uploadImage).toHaveBeenCalledWith(photo);
    expect(authorRepository.save).toHaveBeenCalledTimes(1);
    expect(authorRepository.save).toHaveBeenCalledWith(expect.any(Author));
    const savedAuthor = authorRepository.save.mock.calls[0][0];
    expect(savedAuthor.photoUrl).toBe('https://cdn.example/author-1');
    await moduleRef.close();
  });

  it('rejects a duplicate name before uploading or saving', async () => {
    const { handler, moduleRef, authorRepository, media } =
      await createHandler();
    authorRepository.existsByName.mockResolvedValue(true);

    await expect(
      handler.execute(new CreateAuthorCommand(adminActor, 'Existing Author')),
    ).rejects.toBeInstanceOf(ConflictDomainException);

    expect(media.uploadImage).not.toHaveBeenCalled();
    expect(authorRepository.save).not.toHaveBeenCalled();
    await moduleRef.close();
  });

  it('rejects an actor without create permission before repository access', async () => {
    const { handler, moduleRef, authorRepository } = await createHandler();
    const deniedActor: Actor = {
      userId: 'user-1',
      roles: ['user'],
      ability: new AbilityBuilder<AppAbility>(createPrismaAbility).build(),
    };

    await expect(
      handler.execute(new CreateAuthorCommand(deniedActor, 'Author')),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(authorRepository.existsByName).not.toHaveBeenCalled();
    await moduleRef.close();
  });
});
