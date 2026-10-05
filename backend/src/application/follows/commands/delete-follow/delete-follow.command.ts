import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException, ForbiddenDomainException } from "@/shared/domain/common-exceptions";
import { IFollowRepository } from "@/domain/follows/repositories/follow.repository.interface";
import { UserId } from "@/domain/follows/value-objects/user-id.vo";
import { TargetId } from "@/domain/follows/value-objects/target-id.vo";
import { Injectable, Logger } from "@nestjs/common";

export class DeleteFollowCommand extends Command<{ success: boolean; }> {
  constructor(
    public readonly userId: string,
    public readonly targetId: string,
  ) {
    super();}
}
