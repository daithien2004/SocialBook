import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, BadRequestException } from "@nestjs/common";
import { SendOtpHandler } from "@/application/otp/commands/send-otp/send-otp.handler";
import { SendOtpCommand } from "@/application/otp/commands/send-otp/send-otp.command";
import { IOtpRepository } from "@/domain/auth/otp/repositories/otp.repository.interface";

export class ResendOtpCommand extends Command<{ resendCooldown: number }> {
  constructor(public readonly email: string) { super(); }
}
