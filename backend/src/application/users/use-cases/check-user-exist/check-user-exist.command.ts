import { Command } from '@nestjs/cqrs';

export class CheckUserExistCommand extends Command<any> {
  constructor() { super(); }
}
