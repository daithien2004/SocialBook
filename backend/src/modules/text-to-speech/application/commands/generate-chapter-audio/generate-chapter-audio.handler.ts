import { CommandHandler } from '@nestjs/cqrs';
import { ChapterAudioGenerationService } from '@/modules/text-to-speech/application/services/chapter-audio-generation.service';
import { GenerateChapterAudioCommand } from './generate-chapter-audio.command';

@CommandHandler(GenerateChapterAudioCommand)
export class GenerateChapterAudioHandler {
  constructor(
    private readonly chapterAudioGeneration: ChapterAudioGenerationService,
  ) {}

  execute(command: GenerateChapterAudioCommand) {
    return this.chapterAudioGeneration.execute(command);
  }
}
