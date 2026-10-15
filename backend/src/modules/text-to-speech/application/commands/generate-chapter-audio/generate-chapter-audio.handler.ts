import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChapterAudioGenerationService } from '@/modules/text-to-speech/application/services/chapter-audio-generation.service';
import { GenerateChapterAudioCommand } from './generate-chapter-audio.command';
import { ForbiddenError } from '@casl/ability';

@CommandHandler(GenerateChapterAudioCommand)
export class GenerateChapterAudioHandler implements ICommandHandler<GenerateChapterAudioCommand> {
  constructor(
    private readonly chapterAudioGeneration: ChapterAudioGenerationService,
  ) {}

  async execute(command: GenerateChapterAudioCommand): Promise<string> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'TextToSpeech',
    );
    const result = await this.chapterAudioGeneration.execute(command);
    return result.id;
  }
}
