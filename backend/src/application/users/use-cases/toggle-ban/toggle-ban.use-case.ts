import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { User } from '@/domain/users/entities/user.entity';
import { ToggleBanCommand } from './toggle-ban.command';

@Injectable()
export class ToggleBanUseCase {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(command: ToggleBanCommand): Promise<User> {
        const userId = UserId.create(command.userId);
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
