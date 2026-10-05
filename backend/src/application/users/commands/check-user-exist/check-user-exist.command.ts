import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from "@nestjs/common";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserId } from "@/domain/users/value-objects/user-id.vo";
import { UserEmail } from "@/domain/users/value-objects/user-email.vo";

export class CheckUserExistCommand extends Command<boolean> {
  constructor() { super(); }
}
