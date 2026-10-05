import { Author } from '@/domain/authors/entities/author.entity';
import { Command } from '@nestjs/cqrs';
export class CreateAuthorCommand extends Command<Author> {
  constructor(
    public readonly name: string,
    public readonly bio?: string,
    public readonly photoUrl?: string,
  ) {
    super();
  }
}
