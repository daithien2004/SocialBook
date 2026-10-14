import { Command } from '@nestjs/cqrs';
export class DeleteChapterAudioCommand extends Command<void> {
  constructor(public readonly chapterId: string) {
    super();
  }
}
