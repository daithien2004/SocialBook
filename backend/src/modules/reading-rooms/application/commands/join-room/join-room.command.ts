import { Command } from '@nestjs/cqrs';

import type { Actor } from '@/shared/casl/actor';

export class JoinRoomCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly roomCode: string,
  ) {
    super();
  }
}
