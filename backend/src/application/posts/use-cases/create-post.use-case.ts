import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { PostModerationService } from '../services/post-moderation.service';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { CreatePostCommand } from './create-post.command';

@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaService,
    private readonly bookRepository: IBookRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly postModerationService: PostModerationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    command: CreatePostCommand,
    files?: Express.Multer.File[],
  ): Promise<{ post: Post; moderationMessage?: string }> {
    // Validate Book
    const bookExists = await this.bookRepository.existsById(command.bookId);
    if (!bookExists)
      throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);

    // Upload Images
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.mediaService.uploadMultipleImages(files);
    }

    // Prepare Post Entity
    const post = Post.create({
      id: this.idGenerator.generate(),
      userId: command.userId,
      bookId: command.bookId,
      content: command.content,
      imageUrls,
    });

    // Apply Moderation Flags
    const moderationMessage = await this.postModerationService.moderate(
      post,
      command.content,
    );

    // Save
    const createdPost = await this.postRepository.create(post);


    this.eventEmitter.emit('post.created', {
      postId: createdPost.id,
      userId: command.userId,
      bookId: command.bookId,
    });

    return {
      post: createdPost,
      moderationMessage,
    };
  }
}
