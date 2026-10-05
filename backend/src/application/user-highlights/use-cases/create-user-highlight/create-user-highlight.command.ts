import { Command } from '@nestjs/cqrs';
export class CreateUserHighlightCommand extends Command<any> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly paragraphId: string,
    public readonly content: string,
    public readonly color?: string,
    public readonly note?: string,
  ) { super(); }
}