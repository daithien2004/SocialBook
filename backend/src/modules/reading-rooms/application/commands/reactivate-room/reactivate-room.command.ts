import { Command } from '@nestjs/cqrs';

import type { Actor } from '@/shared/casl/actor';

export class ReactivateRoomCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly roomId: string,
  ) {
    super();
  }
}
