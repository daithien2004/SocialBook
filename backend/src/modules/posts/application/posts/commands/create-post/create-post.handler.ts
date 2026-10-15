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
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import { CreatePostCommand } from './create-post.command';
import { containsVietnameseToxicWords } from '@/modules/content-moderation';
import { IPostModerationPort } from '@/modules/posts/domain/posts/interfaces/post-moderation.port';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<
  CreatePostCommand,
  string
> {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaPort,
    private readonly bookRepository: IBookRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
    private readonly postModerationQueue: IPostModerationPort,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    if (!command.actor.ability.can('create', 'Post')) {
      throw new ForbiddenDomainException(
        PostErrorMessages.POST_CREATE_FORBIDDEN,
      );
    }
    // Validate Book
    const bookExists = await this.bookRepository.existsById(command.bookId);
    if (!bookExists)
      throw new NotFoundDomainException(PostErrorMessages.BOOK_NOT_FOUND);

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
      userId: command.actor.userId,
      bookId: command.bookId,
      content: command.content,
      imageUrls,
    });

    const createdPostId = await this.persistPost(post);

    this.eventEmitter.emit(EventNames.POST_CREATED, {
      postId: createdPostId,
      userId: command.actor.userId,
      bookId: command.bookId,
    });

    // Layer 2: Push Job to Queue for background AI moderation (ASYNCHRONOUS)
    await this.postModerationQueue.enqueue({
      postId: createdPostId,
      content: command.content,
    });

    return createdPostId;
  }

  @Transactional()
  private async persistPost(post: Post): Promise<string> {
    const createdPost = await this.postRepository.create(post);
    return createdPost.id;
  }
}
