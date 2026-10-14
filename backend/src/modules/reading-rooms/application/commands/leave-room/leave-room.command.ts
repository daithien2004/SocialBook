import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class LeaveRoomCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly roomId: string,
    public readonly newHostId?: string,
  ) {
    super();
  }
}
