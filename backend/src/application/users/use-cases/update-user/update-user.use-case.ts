import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { User } from '@/domain/users/entities/user.entity';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { UpdateUserCommand } from './update-user.command';

@Injectable()
export class UpdateUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository
    ) {}

    async execute(command: UpdateUserCommand): Promise<User> {
        const userId = UserId.create(command.id);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (command.username && command.username !== user.username) {
            const exists = await this.userRepository.existsByUsername(command.username, userId);
            if (exists) {
                throw new ConflictException('Username already exists');
            }
        }

        user.updateProfile({
            username: command.username,
            bio: command.bio,
            location: command.location,
            website: command.website,
            image: command.image
        });

        await this.userRepository.save(user);

        return user;
    }
}


