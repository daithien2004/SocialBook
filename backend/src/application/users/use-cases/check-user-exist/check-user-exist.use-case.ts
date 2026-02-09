import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { CheckUserExistQuery } from './check-user-exist.query';

@Injectable()
export class CheckUserExistUseCase {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(query: CheckUserExistQuery): Promise<boolean> {
        try {
            if (query.id) {
                const userId = UserId.create(query.id);
                const user = await this.userRepository.findById(userId);
                return !!user;
            }

            if (query.email) {
                const user = await this.userRepository.findByEmail(UserEmail.create(query.email));
                return !!user;
            }

            if (query.username) {
                const user = await this.userRepository.findByUsername(query.username);
                return !!user;
            }

            return false;
        } catch {
            return false;
        }
    }
}
