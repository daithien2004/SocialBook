import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { ForbiddenError } from '@casl/ability';
import { IChapterRepository } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { UpdateChapterAudioStatusCommand } from './update-chapter-audio-status.command';

@CommandHandler(UpdateChapterAudioStatusCommand)
export class UpdateChapterAudioStatusHandler implements ICommandHandler<UpdateChapterAudioStatusCommand> {
  constructor(private readonly chapterRepository: IChapterRepository) {}

  @Transactional()
  async execute(command: UpdateChapterAudioStatusCommand): Promise<void> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'manage',
      'TextToSpeech',
    );
    await this.chapterRepository.updateTtsStatus(
      command.chapterId,
      command.status,
      command.audioUrl,
    );
  }
}
