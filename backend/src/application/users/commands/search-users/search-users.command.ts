import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { User } from "@/domain/users/entities/user.entity";
import { PaginatedResult } from "@/common/interfaces/pagination.interface";

export class SearchUsersCommand extends Command<PaginatedResult<User>> {
  constructor() { super(); }
}
