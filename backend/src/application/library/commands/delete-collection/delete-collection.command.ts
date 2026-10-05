import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppAbility, Action, Subject } from '@socialbook/shared';
import { ICollectionRepository } from "@/domain/library/repositories/collection.repository.interface";
import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { subject } from "@casl/ability";

export class DeleteCollectionCommand extends Command<void> {
  constructor(public readonly id: string, public readonly userId: string, public readonly ability: AppAbility) { super(); }
}