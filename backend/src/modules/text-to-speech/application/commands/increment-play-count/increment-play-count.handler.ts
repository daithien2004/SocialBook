import { IncrementPlayCountCommand } from './increment-play-count.command';
import { CommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AudioPlayedEvent } from '@/modules/analytics/application/public-api';
import { EventNames } from '@/common/constants/event-names.constant';

@CommandHandler(IncrementPlayCountCommand)
export class IncrementPlayCountHandler {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  execute(chapterId: string): void {
    this.eventEmitter.emit(
      EventNames.AUDIO_PLAYED,
      new AudioPlayedEvent(chapterId),
    );
  }
}
