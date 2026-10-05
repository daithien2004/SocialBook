import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppAbility, Action, Subject } from '@socialbook/shared';
import { NotFoundDomainException, ForbiddenDomainException } from "@/shared/domain/common-exceptions";
import { ICommentRepository } from "@/domain/comments/repositories/comment.repository.interface";
import { CommentId } from "@/domain/comments/value-objects/comment-id.vo";
import { ErrorMessages } from "@/common/constants/error-messages";
import { Injectable, Logger } from "@nestjs/common";
import { subject } from "@casl/ability";

export class DeleteCommentCommand extends Command<{ success: boolean; }> {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly ability: AppAbility,
  ) {
    super();}
}
