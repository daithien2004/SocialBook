import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { IReadingPreferences } from '@/domain/users/value-objects/reading-preferences.vo';
import { User } from '@/domain/users/entities/user.entity';

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


