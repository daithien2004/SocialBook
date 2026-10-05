import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from "@nestjs/common";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserId } from "@/domain/users/value-objects/user-id.vo";
import { TokenRotationPort } from "@/application/ports/token-rotation.port";

export class LogoutCommand extends Command<{ message: string }> {
  constructor(public readonly userId: string) { super(); }
}
