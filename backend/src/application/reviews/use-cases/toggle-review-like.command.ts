import { Command } from '@nestjs/cqrs';
export class ToggleReviewLikeCommand extends Command<any> {
  constructor(
    public readonly reviewId: string,
    public readonly userId: string,
  ) { super(); }
}