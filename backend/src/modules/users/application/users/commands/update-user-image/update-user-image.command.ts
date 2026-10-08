import { Command } from '@nestjs/cqrs';

export class UpdateUserImageCommand extends Command<{ url: string }> {
  constructor(
    public readonly userId: string,
    public readonly file: Express.Multer.File,
  ) {
    super();
  }
}
