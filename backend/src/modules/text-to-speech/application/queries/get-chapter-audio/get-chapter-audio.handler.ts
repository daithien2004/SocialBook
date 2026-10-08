import { GetChapterAudioQuery } from './get-chapter-audio.query';
import { QueryHandler } from '@nestjs/cqrs';
import { ITextToSpeechRepository } from '@/modules/text-to-speech/domain/repositories/text-to-speech.repository.interface';
import { TextToSpeech } from '@/modules/text-to-speech/domain/entities/text-to-speech.entity';

@QueryHandler(GetChapterAudioQuery)
export class GetChapterAudioHandler {
  constructor(private readonly ttsRepository: ITextToSpeechRepository) {}

  async execute(chapterId: string): Promise<TextToSpeech | null> {
    return this.ttsRepository.findCompletedByChapterId(chapterId);
  }
}
