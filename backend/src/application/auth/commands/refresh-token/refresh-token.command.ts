import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedDomainException } from "@/domain/auth/exceptions/auth-exceptions";
import { Inject, Injectable } from "@nestjs/common";
import { IPasswordHasher } from "@/shared/domain/password-hasher.interface";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserId } from "@/domain/users/value-objects/user-id.vo";
import { IRoleRepository } from "@/domain/roles/repositories/role.repository.interface";
import { TokenRotationPort } from "@/application/ports/token-rotation.port";

import { FreshTokens } from '@/application/ports/token-rotation.port';

export class RefreshTokenCommand extends Command<FreshTokens> {
  constructor(
    public readonly userId: string,
    public readonly refreshToken: string,
    public readonly ip: string,
    public readonly userAgent: string,
  ) { super(); }
}
