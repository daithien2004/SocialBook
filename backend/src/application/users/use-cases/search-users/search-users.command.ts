import { Command } from '@nestjs/cqrs';

export class SearchUsersCommand extends Command<any> {
  constructor() { super(); }
}
