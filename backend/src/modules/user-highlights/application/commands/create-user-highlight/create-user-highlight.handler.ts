import { CreateUserHighlightCommand } from './create-user-highlight.command';
import { CommandHandler } from '@nestjs/cqrs';
import { IUserHighlightRepository } from '@/modules/user-highlights/domain/repositories/user-highlight.repository.interface';
import { UserHighlight } from '@/modules/user-highlights/domain/entities/user-highlight.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

@CommandHandler(CreateUserHighlightCommand)
export class CreateUserHighlightHandler {
  constructor(
    private readonly highlightRepository: IUserHighlightRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: CreateUserHighlightCommand): Promise<UserHighlight> {
    const highlight = UserHighlight.create(this.idGenerator.generate(), {
      userId: command.userId,
      bookId: command.bookId,
      chapterId: command.chapterId,
      paragraphId: command.paragraphId,
      content: command.content,
      color: command.color || '#ffeb3b',
      note: command.note,
    });

    await this.highlightRepository.save(highlight);
    return highlight;
  }
}
