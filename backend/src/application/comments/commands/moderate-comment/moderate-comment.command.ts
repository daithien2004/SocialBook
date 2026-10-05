import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { ICommentRepository } from "@/domain/comments/repositories/comment.repository.interface";
import { CommentId } from "@/domain/comments/value-objects/comment-id.vo";
import { ErrorMessages } from "@/common/constants/error-messages";
import { Injectable, Logger } from "@nestjs/common";

export class ModerateCommentCommand extends Command<{ success: boolean; }> {
  constructor(
    public readonly id: string,
    public readonly status: 'approved' | 'rejected',
    public readonly reason?: string,
  ) {
    super();}
}
