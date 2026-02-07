import { Injectable, ConflictException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserEmail } from '../../../domain/value-objects/user-email.vo';
import { CreateUserCommand } from './create-user.command';

import * as bcrypt from 'bcrypt';

@Injectable()
export class CreateUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository
    ) {}

    async execute(command: CreateUserCommand): Promise<User> {
        // Validate uniqueness
        const emailVO = UserEmail.create(command.email);
        const emailExists = await this.userRepository.existsByEmail(emailVO);
        if (emailExists) {
            throw new ConflictException('Email already exists');
        }

        const usernameExists = await this.userRepository.existsByUsername(command.username);
        if (usernameExists) {
            throw new ConflictException('Username already exists');
        }

        let hashedPassword = command.password;
        if (command.password) {
            hashedPassword = await bcrypt.hash(command.password, 10);
        }

        // Create entity
        const user = User.create({
            roleId: command.roleId || 'default-role-id', 
            username: command.username,
            email: command.email,
            password: hashedPassword, 
            image: command.image,
            provider: command.provider,
            providerId: command.providerId
        });

        await this.userRepository.save(user);

        return user;
    }
}
