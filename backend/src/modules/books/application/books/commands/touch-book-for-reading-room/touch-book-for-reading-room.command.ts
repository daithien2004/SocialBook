import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class TouchBookForReadingRoomCommand extends Command<boolean> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
  ) {
    super();
  }
}
