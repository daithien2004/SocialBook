import { Injectable } from '@nestjs/common';
import { ITextToSpeechRepository } from '@/domain/text-to-speech/repositories/text-to-speech.repository.interface';

@Injectable()
export class DeleteChapterAudioUseCase {
    constructor(
        private readonly ttsRepository: ITextToSpeechRepository,
    ) {}

    async execute(chapterId: string): Promise<void> {
        await this.ttsRepository.deleteByChapterId(chapterId);
    }
}

