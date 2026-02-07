import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { IReadingPreferences } from '../../../domain/value-objects/reading-preferences.vo';
import { User } from '../../../domain/entities/user.entity';

export class UpdateReadingPreferencesCommand {
    constructor(
        public readonly userId: string,
        public readonly preferences: Partial<IReadingPreferences>
    ) {}
}

@Injectable()
export class UpdateReadingPreferencesUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(command: UpdateReadingPreferencesCommand): Promise<User> {
        const userId = UserId.create(command.userId);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.updateReadingPreferences(command.preferences);
        await this.userRepository.save(user);

        return user;
    }
}
