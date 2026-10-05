import { Command } from '@nestjs/cqrs';

export class DeleteFollowCommand extends Command<{ success: boolean }> {
  constructor(
    public readonly userId: string,
    public readonly targetId: string,
  ) {
    super();
  }
}
