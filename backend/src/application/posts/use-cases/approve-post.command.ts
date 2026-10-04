import { Command } from '@nestjs/cqrs';
export class ApprovePostCommand extends Command<{ success: boolean; message: string; }> {
  constructor(public readonly postId: string) {
    super();}
}
