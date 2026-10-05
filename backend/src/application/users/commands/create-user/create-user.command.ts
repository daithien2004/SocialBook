import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { ConflictDomainException } from "@/shared/domain/common-exceptions";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";
import { User } from "@/domain/users/entities/user.entity";
import { UserEmail } from "@/domain/users/value-objects/user-email.vo";
import { UserId } from "@/domain/users/value-objects/user-id.vo";
import { IPasswordHasher } from "@/shared/domain/password-hasher.interface";

export class CreateUserCommand extends Command<User> {
  constructor(
    public readonly username: string,
    public readonly email: string,
    public readonly password?: string,
    public readonly roleId?: string,
    public readonly image?: string,
    public readonly provider?: string,
    public readonly providerId?: string,
  ) { super(); }
}
