import { DeleteChapterAudioCommand } from './delete-chapter-audio.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TextToSpeechRepository } from '@/modules/text-to-speech/domain/repositories/text-to-speech.repository';
import { ForbiddenError } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(DeleteChapterAudioCommand)
export class DeleteChapterAudioHandler implements ICommandHandler<DeleteChapterAudioCommand> {
  constructor(private readonly ttsRepository: TextToSpeechRepository) {}

  @Transactional()
  async execute(command: DeleteChapterAudioCommand): Promise<void> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'delete',
      'TextToSpeech',
    );
    await this.ttsRepository.deleteByChapterId(command.chapterId);
  }
}
