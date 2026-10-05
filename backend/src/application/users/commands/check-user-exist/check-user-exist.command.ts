import { Command } from '@nestjs/cqrs';

export class CheckUserExistCommand extends Command<boolean> {
  constructor() {
    super();
  }
}
