import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { DeleteUserCommand } from './delete-user.command';

@Injectable()
export class DeleteUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository
    ) {}

    async execute(command: DeleteUserCommand): Promise<void> {
        const userId = UserId.create(command.id);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.userRepository.delete(userId);
    }
}
