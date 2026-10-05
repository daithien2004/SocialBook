import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, BadRequestException } from "@nestjs/common";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserEmail } from "@/domain/users/value-objects/user-email.vo";
import { VerifyOtpHandler } from "@/application/otp/commands/verify-otp/verify-otp.handler";

export class VerifyOtpCommand extends Command<string> {
  constructor(
    public readonly email: string,
    public readonly otp: string,
  ) { super(); }
}
