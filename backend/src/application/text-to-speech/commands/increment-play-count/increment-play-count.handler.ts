import { IncrementPlayCountCommand } from './increment-play-count.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AudioPlayedEvent } from '@/application/analytics/events/audio-played.event';
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
