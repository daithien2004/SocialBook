import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserId } from "@/domain/users/value-objects/user-id.vo";
import { User } from "@/domain/users/entities/user.entity";

export class UpdateReadingPreferencesCommand extends Command<User> {
  constructor(
    public readonly userId: string,
    public readonly theme?: string,
    public readonly fontSize?: number,
    public readonly fontFamily?: string,
    public readonly lineHeight?: number,
    public readonly letterSpacing?: number,
    public readonly backgroundColor?: string,
    public readonly textColor?: string,
    public readonly textAlign?: string,
    public readonly marginWidth?: number,
    public readonly warmth?: number,
    public readonly brightness?: number,
    public readonly preferredGenres?: string[],
    public readonly dailyReadingGoal?: number,
  ) { super(); }
}
