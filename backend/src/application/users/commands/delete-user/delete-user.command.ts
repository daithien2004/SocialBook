import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserId } from "@/domain/users/value-objects/user-id.vo";

export class DeleteUserCommand extends Command<void> {
  constructor(public readonly id: string) { super(); }
}
