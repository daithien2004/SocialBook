import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppAbility, Action, Subject } from '@socialbook/shared';
import { ForbiddenDomainException, NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IPostRepository } from "@/domain/posts/repositories/post.repository.interface";
import { ErrorMessages } from "@/common/constants/error-messages";
import { subject } from "@casl/ability";

export class DeletePostCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
    public readonly ability: AppAbility,
    public readonly isHardDelete: boolean = false,
  ) {
    super();}
}
