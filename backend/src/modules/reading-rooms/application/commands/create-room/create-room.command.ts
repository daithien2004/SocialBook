import { Command } from '@nestjs/cqrs';

import type { Actor } from '@/shared/casl/actor';

export class CreateRoomCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly mode: 'sync' | 'free',
    public readonly idempotencyKey: string,
    public readonly maxMembers?: number,
  ) {
    super();
  }
}
