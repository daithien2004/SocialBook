import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { BooksRepository } from '../books/books.repository';
import { PostsRepository } from './posts.repository';
import { PostDocument } from './schemas/post.schema';

import { CacheService } from '@/src/shared/cache/cache.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ContentModerationService } from '../content-moderation/content-moderation.service';

import { ErrorMessages } from '@/src/common/constants/error-messages';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostModal } from './modals/post.modal';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly booksRepository: BooksRepository,
    private cloudinaryService: CloudinaryService,
    private contentModerationService: ContentModerationService,
    private readonly cacheService: CacheService,
  ) { }

  async findAll(page: number = 1, limit: number = 10) {
    const cacheKey = `posts:feed:global:page:${page}:limit:${limit}`;
    const cachedData = await this.cacheService.get<Record<string, unknown>>(cacheKey);
    if (cachedData) return cachedData;

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postsRepository.findAllWithPopulate(skip, limit),
      this.postsRepository.count({ isDelete: false, isFlagged: false }),
    ]);

    const result = {
      items: PostModal.fromArray(posts),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const skip = (page - 1) * limit;
    const userObjectId = new Types.ObjectId(userId);

    const query = { isDelete: false, isFlagged: false, userId: userObjectId };

    const [posts, total] = await Promise.all([
      this.postsRepository.findAllWithPopulate(skip, limit, query),
      this.postsRepository.count(query),
    ]);

    return {
      items: PostModal.fromArray(posts),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const cacheKey = `post:id:${id}`;
    const cachedPost = await this.cacheService.get<PostModal>(cacheKey);
    if (cachedPost) return cachedPost;

    const post = await this.postsRepository.findByIdWithPopulate(id);

    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    const modal = new PostModal(post);
    await this.cacheService.set(cacheKey, modal, 1800);
    return modal;
  }

  async create(
    userId: string,
    dto: CreatePostDto,
    files?: Express.Multer.File[],
  ) {
    if (!Types.ObjectId.isValid(dto.bookId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    // Check content moderation
    const moderationResult = await this.contentModerationService.checkContent(dto.content);
    console.log('🔍 Moderation result:', moderationResult);

    const bookExists = await this.booksRepository.existsById(dto.bookId);
    if (!bookExists) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);

    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.cloudinaryService.uploadMultipleImages(files);
    }

    // Prepare post data
    const postData: Partial<PostDocument> = {
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(dto.bookId),
      content: dto.content,
      imageUrls,
      isDelete: false,
    };

    // If content is flagged, save with flag instead of rejecting
    if (!moderationResult.isSafe) {
      const reason = moderationResult.reason ||
        (moderationResult.isSpoiler ? 'Phát hiện nội dung spoiler' :
          moderationResult.isToxic ? 'Phát hiện nội dung độc hại' :
            'Nội dung không phù hợp');

      postData.isFlagged = true;
      postData.moderationReason = reason;
      postData.moderationStatus = 'pending';
    }

    const result = await this.postsRepository.createPost(postData);

    if (!result) {
      throw new InternalServerErrorException('Failed to create post');
    }

    await this.cacheService.clear('posts:feed:global:*');

    const modal = new PostModal(result);

    if (result.isFlagged) {
      return {
        ...modal,
        warning: `Bài viết phát hiện nội dung vi phạm cần quản trị viên phê duyệt: ${result.moderationReason}`,
      };
    }

    return modal;
  }

  async update(id: string, dto: UpdatePostDto, files?: Express.Multer.File[]) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const post = await this.postsRepository.findOneForUpdate(id);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    let newImageUrls: string[] = [];
    if (files && files.length > 0) {
      newImageUrls = await this.cloudinaryService.uploadMultipleImages(files);
    }

    if (dto.content) {
      // Check content moderation for updated content
      const moderationResult = await this.contentModerationService.checkContent(dto.content);

      if (!moderationResult.isSafe) {
        const reason = moderationResult.reason || 'Nội dung không phù hợp';
        post.isFlagged = true;
        post.moderationReason = reason;
        post.moderationStatus = 'pending';
      } else {
        // If content was previously flagged but now safe, clear flags
        post.isFlagged = false;
        post.moderationReason = undefined;
        post.moderationStatus = undefined;
      }

      post.content = dto.content;
    }

    if (dto.bookId) {
      if (!Types.ObjectId.isValid(dto.bookId))
        throw new BadRequestException(ErrorMessages.INVALID_ID);
      const bookExists = await this.booksRepository.existsById(dto.bookId);
      if (!bookExists) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
      post.bookId = new Types.ObjectId(dto.bookId);
    }

    if (newImageUrls.length > 0) {
      post.imageUrls = [...post.imageUrls, ...newImageUrls];
    }

    post.updatedAt = new Date();
    const updatedPost = await this.postsRepository.updateWithPopulate(post);

    await Promise.all([
      this.cacheService.del(`post:id:${id}`),
      this.cacheService.clear('posts:feed:global:*'),
    ]);

    return new PostModal(updatedPost!);
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    await this.postsRepository.softDelete(id);

    // Invalidate Cache
    await Promise.all([
      this.cacheService.del(`post:id:${id}`),
      this.cacheService.clear('posts:feed:global:*'),
    ]);

    return { success: true };
  }

  async removeHard(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const post = await this.postsRepository.findById(id);
    if (post && post.imageUrls && post.imageUrls.length > 0) {
      // Logic delete from cloud loop here if needed
    }

    await this.postsRepository.delete(id);

    // Invalidate Cache
    await Promise.all([
      this.cacheService.del(`post:id:${id}`),
      this.cacheService.clear('posts:feed:global:*'),
    ]);

    // Emulated result since delete returns void
    return { success: true };
  }

  async removeImage(postId: string, imageUrl: string) {
    if (!Types.ObjectId.isValid(postId))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const post = await this.postsRepository.findOneForUpdate(postId);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    post.imageUrls = post.imageUrls.filter((url) => url !== imageUrl);
    post.updatedAt = new Date();
    await post.save();

    this.cloudinaryService
      .deleteImage(imageUrl)
      .catch((err) => console.error('Cloudinary delete error:', err));

    return {
      imageUrls: post.imageUrls,
    };
  }

  // ===== ADMIN METHODS =====

  async getFlaggedPosts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postsRepository.getFlaggedPosts(skip, limit),
      this.postsRepository.count({ isFlagged: true, isDelete: false }),
    ]);

    return {
      items: PostModal.fromArray(posts),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approvePost(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const post = await this.postsRepository.findOneForUpdate(id);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    if (!post.isFlagged) {
      throw new BadRequestException('Post is not flagged');
    }

    post.isFlagged = false;
    post.moderationStatus = 'approved';
    post.updatedAt = new Date();
    await post.save();

    // Invalidate Cache
    await Promise.all([
      this.cacheService.del(`post:id:${id}`),
      this.cacheService.clear('posts:feed:global:*'),
    ]);

    return { success: true, message: 'Post approved successfully' };
  }

  async rejectPost(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const post = await this.postsRepository.findById(id);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    // Hard delete the rejected post
    await this.postsRepository.delete(id);

    // Invalidate Cache
    await Promise.all([
      this.cacheService.del(`post:id:${id}`),
      this.cacheService.clear('posts:feed:global:*'),
    ]);

    return { success: true, message: 'Post rejected and deleted' };
  }
}
