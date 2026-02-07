import { Injectable } from '@nestjs/common';
import { ITextToSpeechRepository } from '../../domain/repositories/text-to-speech.repository.interface';

@Injectable()
export class IncrementPlayCountUseCase {
    constructor(
        private readonly ttsRepository: ITextToSpeechRepository,
    ) {}

    async execute(chapterId: string): Promise<void> {
        const audio = await this.ttsRepository.findCompletedByChapterId(chapterId);
        if (audio) {
            audio.incrementPlayCount();
            await this.ttsRepository.save(audio);
        }
    }
}
