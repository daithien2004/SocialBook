import { Command } from '@nestjs/cqrs';
export class DeleteFollowCommand extends Command<any> {
  constructor(
    public readonly userId: string,
    public readonly targetId: string,
  ) {
    super();}
}
