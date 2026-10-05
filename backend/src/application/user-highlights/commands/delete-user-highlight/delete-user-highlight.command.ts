import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { AppAbility, Action, Subject } from '@socialbook/shared';
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { IUserHighlightRepository } from "@/domain/user-highlights/repositories/user-highlight.repository.interface";
import { subject } from "@casl/ability";

export class DeleteUserHighlightCommand extends Command<void> {
  constructor(
    public readonly highlightId: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
  ) { super(); }
}