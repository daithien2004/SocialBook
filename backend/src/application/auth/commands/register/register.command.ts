import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, ConflictException, InternalServerErrorException, Logger } from "@nestjs/common";
import { IPasswordHasher } from "@/shared/domain/password-hasher.interface";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { CreateUserHandler } from "@/application/users/commands/create-user/create-user.handler";
import { CreateUserCommand } from "@/application/users/commands/create-user/create-user.command";
import { GetRoleByNameHandler } from "@/application/roles/queries/get-role-by-name/get-role-by-name.handler";
import { GetRoleByNameQuery } from "@/application/roles/queries/get-role-by-name/get-role-by-name.query";
import { UserEmail } from "@/domain/users/value-objects/user-email.vo";
import { SendOtpHandler } from "@/application/otp/commands/send-otp/send-otp.handler";
import { SendOtpCommand } from "@/application/otp/commands/send-otp/send-otp.command";

export class RegisterCommand extends Command<string> {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly password?: string,
  ) { super(); }
}
