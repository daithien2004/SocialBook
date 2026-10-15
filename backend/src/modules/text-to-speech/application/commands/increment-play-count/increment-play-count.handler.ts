import { IncrementPlayCountCommand } from './increment-play-count.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError } from '@casl/ability';
import { TextToSpeechPlayCountStore } from '../../ports/text-to-speech-play-count.store';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(IncrementPlayCountCommand)
export class IncrementPlayCountHandler implements ICommandHandler<IncrementPlayCountCommand> {
  constructor(private readonly playCountStore: TextToSpeechPlayCountStore) {}

  @Transactional()
  async execute(command: IncrementPlayCountCommand): Promise<void> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      'TextToSpeech',
    );
    await this.playCountStore.incrementCompletedByChapterId(command.chapterId);
  }
}
