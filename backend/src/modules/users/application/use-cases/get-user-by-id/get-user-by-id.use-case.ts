import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserId } from '../../../domain/value-objects/user-id.vo';

@Injectable()
export class GetUserByIdUseCase {
    constructor(
        private readonly userRepository: IUserRepository
    ) {}

    async execute(id: string): Promise<User> {
        const userId = UserId.create(id);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }
}
