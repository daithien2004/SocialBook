import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { User } from '@/domain/users/entities/user.entity';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { GetUserByIdQuery } from './get-user-by-id.query';

@Injectable()
export class GetUserByIdUseCase {
    constructor(
        private readonly userRepository: IUserRepository
    ) { }

    async execute(query: GetUserByIdQuery): Promise<User> {
        const userId = UserId.create(query.id);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }
}
