import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserId } from "@/domain/users/value-objects/user-id.vo";
import { User } from "@/domain/users/entities/user.entity";
import { EventNames } from "@/common/constants/event-names.constant";

export class ToggleBanCommand extends Command<User> {
  constructor(public readonly userId: string) { super(); }
}
