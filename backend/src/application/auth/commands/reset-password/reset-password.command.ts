import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, BadRequestException } from "@nestjs/common";
import { IPasswordHasher } from "@/shared/domain/password-hasher.interface";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserEmail } from "@/domain/users/value-objects/user-email.vo";
import { VerifyOtpHandler } from "@/application/otp/commands/verify-otp/verify-otp.handler";
import { VerifyOtpCommand } from "@/application/otp/commands/verify-otp/verify-otp.command";

export class ResetPasswordCommand extends Command<string> {
  constructor(
    public readonly email: string,
    public readonly otp: string,
    public readonly newPassword: string,
  ) { super(); }
}
