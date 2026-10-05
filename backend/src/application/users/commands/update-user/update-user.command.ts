import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { NotFoundDomainException, ConflictDomainException } from "@/shared/domain/common-exceptions";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { User } from "@/domain/users/entities/user.entity";
import { UserId } from "@/domain/users/value-objects/user-id.vo";

export class UpdateUserCommand extends Command<User> {
  constructor(
    public readonly id: string,
    public readonly username?: string,
    public readonly bio?: string,
    public readonly location?: string,
    public readonly website?: string,
    public readonly image?: string,
  ) { super(); }
}
