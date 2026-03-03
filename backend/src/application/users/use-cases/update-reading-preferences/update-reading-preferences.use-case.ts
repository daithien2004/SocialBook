import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { User } from '@/domain/users/entities/user.entity';
import { UpdateReadingPreferencesCommand } from './update-reading-preferences.command';

@Injectable()
export class UpdateReadingPreferencesUseCase {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(command: UpdateReadingPreferencesCommand): Promise<User> {
        const userId = UserId.create(command.userId);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { userId: _, ...preferences } = command;
        user.updateReadingPreferences(preferences);
        await this.userRepository.save(user);

        return user;
    }
}
