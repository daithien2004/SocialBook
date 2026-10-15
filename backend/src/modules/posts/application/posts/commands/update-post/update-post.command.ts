import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class UpdatePostCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly postId: string,
    public readonly content?: string,
    public readonly bookId?: string,
    public readonly imageUrls?: string[],
    public readonly files?: Express.Multer.File[],
  ) {
    super();
  }
}
