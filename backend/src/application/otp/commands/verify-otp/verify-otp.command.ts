import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from "@/common/utils/error.util";
import { Injectable, Logger } from "@nestjs/common";
import { BadRequestDomainException, InternalServerDomainException } from "@/shared/domain/common-exceptions";
import { IOtpRepository } from "@/domain/auth/otp/repositories/otp.repository.interface";

export class VerifyOtpCommand extends Command<boolean> {
  constructor(
    public readonly email: string,
    public readonly otp: string,
  ) { super(); }
}
