import { Follow } from '@/domain/follows/entities/follow.entity';
import { Command } from '@nestjs/cqrs';
export class CreateFollowCommand extends Command<Follow> {
  constructor(
    public readonly userId: string,
    public readonly targetId: string,
    public readonly status?: boolean,
  ) {
    super();
  }
}
