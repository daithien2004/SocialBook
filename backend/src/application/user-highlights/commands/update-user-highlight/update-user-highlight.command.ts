import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { AppAbility, Action, Subject } from '@socialbook/shared';
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { IUserHighlightRepository } from "@/domain/user-highlights/repositories/user-highlight.repository.interface";
import { UserHighlight } from "@/domain/user-highlights/entities/user-highlight.entity";
import { subject } from "@casl/ability";

export class UpdateUserHighlightCommand extends Command<UserHighlight> {
  constructor(
    public readonly highlightId: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
    public readonly color?: string,
    public readonly note?: string,
  ) { super(); }
}