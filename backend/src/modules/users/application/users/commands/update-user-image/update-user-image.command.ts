import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class UpdateUserImageCommand extends Command<{ url: string }> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly file: Express.Multer.File,
  ) {
    super();
  }
}
