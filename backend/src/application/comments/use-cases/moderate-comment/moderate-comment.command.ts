import { Command } from '@nestjs/cqrs';
export class ModerateCommentCommand extends Command<any> {
  constructor(
    public readonly id: string,
    public readonly status: 'approved' | 'rejected',
    public readonly reason?: string,
  ) {
    super();}
}
