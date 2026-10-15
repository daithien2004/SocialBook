import { UpdateReadingPreferencesCommand } from './update-reading-preferences.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { ReadingPreferences } from '@/modules/users/domain/users/value-objects/reading-preferences.vo';
import { toReadingPreferencesResult } from '@/modules/users/application/reading-preferences.result';
import type { ReadingPreferencesResult } from '@/modules/users/application/reading-preferences.result';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(UpdateReadingPreferencesCommand)
export class UpdateReadingPreferencesHandler implements ICommandHandler<UpdateReadingPreferencesCommand> {
  constructor(private readonly userRepository: IUserRepository) {}

  @Transactional()
  async execute(
    command: UpdateReadingPreferencesCommand,
  ): Promise<ReadingPreferencesResult> {
    const userId = UserId.create(command.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('User', { id: user.id.toString() }),
    );

    const { ...preferences } = command;
    user.updateReadingPreferences(preferences);
    await this.userRepository.save(user);

    return toReadingPreferencesResult(
      user.readingPreferences ?? ReadingPreferences.createDefault(),
    );
  }
}
