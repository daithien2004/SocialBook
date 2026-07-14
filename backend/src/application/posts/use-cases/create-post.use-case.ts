import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundDomainException,
  BadRequestDomainException,
} from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { CreatePostCommand } from './create-post.command';
import { containsVietnameseToxicWords } from '@/domain/content-moderation/utils/vietnamese-profanity';
import {
  POST_MODERATION_QUEUE,
  POST_MODERATION_JOB,
  PostModerationJobData,
} from '@/infrastructure/queues/post-moderation/post-moderation.processor';

@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaService,
    private readonly bookRepository: IBookRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(POST_MODERATION_QUEUE)
    private readonly moderationQueue: Queue<PostModerationJobData>,
  ) {}

  async execute(
    command: CreatePostCommand,
    files?: Express.Multer.File[],
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
    if (files && files.length > 0) {
      imageUrls = await this.mediaService.uploadMultipleImages(files);
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

    this.eventEmitter.emit('post.created', {
      postId: createdPost.id,
      userId: command.userId,
      bookId: command.bookId,
    });

    // Layer 2: Push Job to Queue for background AI moderation (ASYNCHRONOUS)
    await this.moderationQueue.add(
      POST_MODERATION_JOB,
      {
        postId: createdPost.id,
        content: command.content,
      },
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    return { post: createdPost };
  }
}
