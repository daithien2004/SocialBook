import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { AppAbility, Action, Subject } from '@socialbook/shared';
import { Injectable } from "@nestjs/common";
import { ErrorMessages } from "@/common/constants/error-messages";
import { NotFoundDomainException, ForbiddenDomainException } from "@/shared/domain/common-exceptions";
import { IReviewRepository } from "@/domain/reviews/repositories/review.repository.interface";
import { subject } from "@casl/ability";

export class DeleteReviewCommand extends Command<void> {
  constructor(
    public readonly id: string,
    public readonly ability: AppAbility,
  ) { super(); }
}