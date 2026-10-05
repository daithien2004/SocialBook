import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from "@/common/utils/error.util";
import { Injectable, Logger } from "@nestjs/common";
import { InternalServerDomainException } from "@/shared/domain/common-exceptions";
import { IMailerPort } from "@/domain/auth/otp/interfaces/mailer.port";
import { IOtpRepository } from "@/domain/auth/otp/repositories/otp.repository.interface";
import { Otp } from "@/domain/auth/otp/entities/otp.entity";

export class SendOtpCommand extends Command<string> {
  constructor(public readonly email: string) { super(); }
}
