import { Command } from '@nestjs/cqrs';

export class UpdateUserImageCommand extends Command<any> {
  constructor(
    public readonly userId: string,
    public readonly file: Express.Multer.File,
  ) {
    super();
  }
}
