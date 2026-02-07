import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { ReadingPreferences } from '../../../domain/value-objects/reading-preferences.vo';

@Injectable()
export class GetReadingPreferencesUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(id: string): Promise<ReadingPreferences> {
        const userId = UserId.create(id);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user.readingPreferences || ReadingPreferences.createDefault();
    }
}
