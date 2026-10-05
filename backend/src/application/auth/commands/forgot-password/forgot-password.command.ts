import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, BadRequestException } from "@nestjs/common";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserEmail } from "@/domain/users/value-objects/user-email.vo";
import { SendOtpHandler } from "@/application/otp/commands/send-otp/send-otp.handler";
import { SendOtpCommand } from "@/application/otp/commands/send-otp/send-otp.command";

export class ForgotPasswordCommand extends Command<string> {
  constructor(public readonly email: string) { super(); }
}
