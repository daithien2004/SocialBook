import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AudioPlayedEvent } from '@/application/analytics/events/audio-played.event';

@Injectable()
export class IncrementPlayCountUseCase {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  execute(chapterId: string): void {
    this.eventEmitter.emit('audio.played', new AudioPlayedEvent(chapterId));
  }
}
