import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { User } from '../../../domain/entities/user.entity';

@Injectable()
export class ToggleBanUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(id: string): Promise<User> {
        const userId = UserId.create(id);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.isBanned) {
            user.unban();
        } else {
            user.ban();
        }

        await this.userRepository.save(user);
        return user;
    }
}
