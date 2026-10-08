import { DeleteChapterAudioCommand } from './delete-chapter-audio.command';
import { CommandHandler } from '@nestjs/cqrs';
import { ITextToSpeechRepository } from '@/modules/text-to-speech/domain/repositories/text-to-speech.repository.interface';

@CommandHandler(DeleteChapterAudioCommand)
export class DeleteChapterAudioHandler {
  constructor(private readonly ttsRepository: ITextToSpeechRepository) {}

  async execute(chapterId: string): Promise<void> {
    await this.ttsRepository.deleteByChapterId(chapterId);
  }
}
