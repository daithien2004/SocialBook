import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OAuthProfile } from '@/application/auth/services/oauth-provider.strategy';
import { ConflictException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { UnauthorizedDomainException, UserBannedDomainException } from "@/domain/auth/exceptions/auth-exceptions";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { IRoleRepository } from "@/domain/roles/repositories/role.repository.interface";
import { UserEmail } from "@/domain/users/value-objects/user-email.vo";
import { CreateUserCommand } from "@/application/users/commands/create-user/create-user.command";
import { CreateUserHandler } from "@/application/users/commands/create-user/create-user.handler";

export class OAuthAuthCommand extends Command<{ accessToken: string; refreshToken: string; user: { id: string; email: string; username: string; image: string | undefined; role: string; }; }> {
  constructor(public readonly profile: OAuthProfile) { super(); }
}
