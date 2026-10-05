import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from "@nestjs/common";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";

import { UserLocationSummary } from '@/application/statistics/commands/check-user-locations/check-user-locations.handler';

export class CheckUserLocationsCommand extends Command<UserLocationSummary> {
  constructor() { super(); }
}
