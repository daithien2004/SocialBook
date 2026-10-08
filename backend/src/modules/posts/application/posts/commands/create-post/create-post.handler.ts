import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundDomainException,
  BadRequestDomainException,
} from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { IMediaPort } from '@/modules/media/domain/public-api';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Post } from '@/modules/posts/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { CreatePostCommand } from './create-post.command';
import { containsVietnameseToxicWords } from '@/modules/content-moderation/domain';
import { IPostModerationPort } from '@/modules/posts/domain/posts/interfaces/post-moderation.port';
import { EventNames } from '@/common/constants/event-names.constant';

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<
  CreatePostCommand,
  { post: Post; moderationMessage?: string }
> {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaPort,
    private readonly bookRepository: IBookRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
    private readonly postModerationQueue: IPostModerationPort,
  ) {}

  async execute(
    command: CreatePostCommand,
  ): Promise<{ post: Post; moderationMessage?: string }> {
    // Validate Book
    const bookExists = await this.bookRepository.existsById(command.bookId);
    if (!bookExists)
      throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);

    // Layer 1: Quick regex check (obvious profanity) — SYNCHRONOUS, immediate
    const quickCheck = containsVietnameseToxicWords(command.content);
    if (quickCheck) {
      throw new BadRequestDomainException(
        `Nội dung chứa từ ngữ thô tục không phù hợp: "${quickCheck.matchedWord}" (nhóm: ${quickCheck.group}).`,
      );
    }

    // Upload Images
    let imageUrls: string[] = [];
    if (command.files && command.files.length > 0) {
      imageUrls = await this.mediaService.uploadMultipleImages(command.files);
    }

    // Create and save the post immediately (PENDING status — visible to user)
    const post = Post.create({
      id: this.idGenerator.generate(),
      userId: command.userId,
      bookId: command.bookId,
      content: command.content,
      imageUrls,
    });

    const createdPost = await this.postRepository.create(post);

    this.eventEmitter.emit(EventNames.POST_CREATED, {
      postId: createdPost.id,
      userId: command.userId,
      bookId: command.bookId,
    });

    // Layer 2: Push Job to Queue for background AI moderation (ASYNCHRONOUS)
    await this.postModerationQueue.enqueue({
      postId: createdPost.id,
      content: command.content,
    });

    return { post: createdPost };
  }
}
