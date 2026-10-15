import { CreateUserHighlightCommand } from './create-user-highlight.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserHighlightRepository } from '@/modules/user-highlights/domain/repositories/user-highlight.repository.interface';
import { UserHighlight } from '@/modules/user-highlights/domain/entities/user-highlight.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { subject } from '@casl/ability';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(CreateUserHighlightCommand)
export class CreateUserHighlightHandler implements ICommandHandler<CreateUserHighlightCommand> {
  constructor(
    private readonly highlightRepository: IUserHighlightRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  @Transactional()
  async execute(command: CreateUserHighlightCommand): Promise<string> {
    const id = this.idGenerator.generate();
    if (
      !command.actor.ability.can(
        'create',
        subject('UserHighlight', { id, userId: command.actor.userId }),
      )
    ) {
      throw new ForbiddenDomainException('USER_HIGHLIGHT_CREATE_FORBIDDEN');
    }
    const highlight = UserHighlight.create(id, {
      userId: command.actor.userId,
      bookId: command.bookId,
      chapterId: command.chapterId,
      paragraphId: command.paragraphId,
      content: command.content,
      color: command.color || '#ffeb3b',
      note: command.note,
    });

    await this.highlightRepository.save(highlight);
    return highlight.id;
  }
}
