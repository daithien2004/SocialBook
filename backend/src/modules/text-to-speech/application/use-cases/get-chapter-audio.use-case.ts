import { Injectable, NotFoundException } from '@nestjs/common';
import { ITextToSpeechRepository } from '../../domain/repositories/text-to-speech.repository.interface';
import { TextToSpeech } from '../../domain/entities/text-to-speech.entity';

@Injectable()
export class GetChapterAudioUseCase {
    constructor(
        private readonly ttsRepository: ITextToSpeechRepository,
    ) {}

    async execute(chapterId: string): Promise<TextToSpeech | null> {
        return this.ttsRepository.findCompletedByChapterId(chapterId);
    }
}
