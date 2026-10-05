import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { User } from '@/domain/users/entities/user.entity';
import { Injectable } from "@nestjs/common";
import { UnauthorizedDomainException, UserBannedDomainException } from "@/domain/auth/exceptions/auth-exceptions";
import { IRoleRepository } from "@/domain/roles/repositories/role.repository.interface";

export class LoginCommand extends Command<{ accessToken: string; refreshToken: string; user: { id: string; email: string; username: string; image: string | undefined; role: string; }; }> {
  constructor(
    public readonly user: User,
    public readonly ip?: string,
    public readonly userAgent?: string,
  ) { super(); }
}
