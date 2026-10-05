import { Command } from '@nestjs/cqrs';
export class RejectPostCommand extends Command<{ success: boolean; message: string; }> {
  constructor(
    public readonly postId: string,
    public readonly reason: string,
  ) {
    super();}
}
