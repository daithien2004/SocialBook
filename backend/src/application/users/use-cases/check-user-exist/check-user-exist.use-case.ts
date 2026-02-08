import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';

@Injectable()
export class CheckUserExistUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(id: string): Promise<boolean> {
        try {
            const userId = UserId.create(id);
            const user = await this.userRepository.findById(userId);
            return !!user;
        } catch (error) {
            return false; 
        }
    }
}


