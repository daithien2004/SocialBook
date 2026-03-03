import { Injectable, NotFoundException } from '@nestjs/common';
import { ITextToSpeechRepository } from '@/domain/text-to-speech/repositories/text-to-speech.repository.interface';
import { TextToSpeech } from '@/domain/text-to-speech/entities/text-to-speech.entity';

@Injectable()
export class GetChapterAudioUseCase {
    constructor(
        private readonly ttsRepository: ITextToSpeechRepository,
    ) {}

    async execute(chapterId: string): Promise<TextToSpeech | null> {
        return this.ttsRepository.findCompletedByChapterId(chapterId);
    }
}

