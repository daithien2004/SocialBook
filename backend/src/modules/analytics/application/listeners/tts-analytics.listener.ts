import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ITextToSpeechRepository } from '@/modules/text-to-speech/domain';
import { AudioPlayedEvent } from '../events/audio-played.event';
import { EventNames } from '@/shared/platform/constants/event-names.constant';

@Injectable()
export class TtsAnalyticsListener {
  private readonly logger = new Logger(TtsAnalyticsListener.name);

  constructor(private readonly ttsRepository: ITextToSpeechRepository) {}

  @OnEvent(EventNames.AUDIO_PLAYED, { async: true })
  async handleAudioPlayedEvent(event: AudioPlayedEvent) {
    try {
      this.logger.debug(
        `Incrementing play count for audio chapter: ${event.chapterId}`,
      );
      const audio = await this.ttsRepository.findCompletedByChapterId(
        event.chapterId,
      );
      if (audio) {
        audio.incrementPlayCount();
        await this.ttsRepository.save(audio);
      }
    } catch (error) {
      this.logger.error(
        `Failed to increment play count for chapter ${event.chapterId}`,
        error,
      );
    }
  }
}
