import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { PaginatedResult } from '@/src/common/interfaces/pagination.interface';

@Injectable()
export class SearchUsersUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(keyword: string, page: number, limit: number): Promise<PaginatedResult<User>> {
        return this.userRepository.findAll(
            { username: keyword },
            { page, limit }
        );
    }
}
