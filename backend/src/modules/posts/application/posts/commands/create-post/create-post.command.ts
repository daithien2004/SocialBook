import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class CreatePostCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
    public readonly content: string,
    public readonly files?: Express.Multer.File[],
  ) {
    super();
  }
}
