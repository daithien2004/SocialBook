import { Command } from '@nestjs/cqrs';
import { UserHighlight } from '@/modules/user-highlights/domain/entities/user-highlight.entity';

export class CreateUserHighlightCommand extends Command<UserHighlight> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly paragraphId: string,
    public readonly content: string,
    public readonly color?: string,
    public readonly note?: string,
  ) {
    super();
  }
}
