import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Post, PostDocument } from './schemas/post.schema';
import { Book, BookDocument } from '../books/schemas/book.schema';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ContentModerationService } from '../content-moderation/content-moderation.service';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    private cloudinaryService: CloudinaryService,
    private contentModerationService: ContentModerationService,
  ) { }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postModel
        .find({ isDelete: false, isFlagged: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email image')
        .populate({
          path: 'bookId',
          select: 'title coverUrl',
          populate: {
            path: 'authorId',
            select: 'name bio',
          },
        })
        .lean(),
      this.postModel.countDocuments({ isDelete: false, isFlagged: false }),
    ]);

    return {
      items: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid User ID');
    }

    const skip = (page - 1) * limit;
    const userObjectId = new Types.ObjectId(userId);

    const query = { isDelete: false, isFlagged: false, userId: userObjectId }; // luôn có userId

    const [posts, total] = await Promise.all([
      this.postModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email image')
        .populate({
          path: 'bookId',
          select: 'title coverUrl',
          populate: {
            path: 'authorId',
            select: 'name bio',
          },
        })
        .lean(),
      this.postModel.countDocuments(query),
    ]);

    return {
      items: posts,
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
      throw new BadRequestException('Invalid Post ID');

    const post = await this.postModel
      .findOne({ _id: id, isDelete: false, isFlagged: false })
      .populate('userId', 'username email image')
      .populate({
        path: 'bookId',
        select: 'title coverUrl',
        populate: {
          path: 'authorId',
          select: 'name bio',
        },
      })
      .lean();

    if (!post) throw new NotFoundException('Post not found');

    return post;
  }

  async create(
    userId: string,
    dto: CreatePostDto,
    files?: Express.Multer.File[],
  ) {
    if (!Types.ObjectId.isValid(dto.bookId)) {
      throw new BadRequestException('Invalid Book ID');
    }

    // Check content moderation
    const moderationResult = await this.contentModerationService.checkContent(dto.content);
    console.log('🔍 Moderation result:', moderationResult);

    const bookExists = await this.bookModel.exists({ _id: dto.bookId });
    if (!bookExists) throw new NotFoundException('Book not found');

    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.cloudinaryService.uploadMultipleImages(files);
    }

    // Prepare post data
    const postData: any = {
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

    const newPost = await this.postModel.create(postData);

    // Return populated result with moderation info
    const result = await this.postModel
      .findById(newPost._id)
      .populate('userId', 'name email image')
      .populate('bookId', 'title coverUrl')
      .lean() as any;

    // Add warning message if flagged
    if (result.isFlagged) {
      return {
        ...result,
        warning: `Bài viết phát hiện nội dung vi phạm cần quản trị viên phê duyệt: ${result.moderationReason}`,
      };
    }

    return result;
  }

  async update(id: string, dto: UpdatePostDto, files?: Express.Multer.File[]) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid Post ID');

    const post = await this.postModel.findOne({ _id: id, isDelete: false });
    if (!post) throw new NotFoundException('Post not found');

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
        throw new BadRequestException('Invalid Book ID');
      const bookExists = await this.bookModel.exists({ _id: dto.bookId });
      if (!bookExists) throw new NotFoundException('New Book not found');
      post.bookId = new Types.ObjectId(dto.bookId);
    }

    if (newImageUrls.length > 0) {
      post.imageUrls = [...post.imageUrls, ...newImageUrls];
    }

    post.updatedAt = new Date();
    const updatedPost = await post.save();

    return await this.postModel
      .findById(updatedPost._id)
      .populate('userId', 'name email image')
      .populate('bookId', 'title coverUrl')
      .lean();
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid Post ID');

    const post = await this.postModel.findOneAndUpdate(
      { _id: id, isDelete: false },
      { isDelete: true, updatedAt: new Date() },
      { new: true },
    );

    if (!post) throw new NotFoundException('Post not found');

    return { success: true };
  }

  async removeHard(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid Post ID');

    const post = await this.postModel.findById(id);
    if (post && post.imageUrls && post.imageUrls.length > 0) {
      // Logic delete from cloud loop here if needed
    }

    const result = await this.postModel.deleteOne({ _id: id });
    if (result.deletedCount === 0)
      throw new NotFoundException('Post not found');

    return { success: true };
  }

  async removeImage(postId: string, imageUrl: string) {
    if (!Types.ObjectId.isValid(postId))
      throw new BadRequestException('Invalid Post ID');

    const post = await this.postModel.findOne({ _id: postId, isDelete: false });
    if (!post) throw new NotFoundException('Post not found');

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
      this.postModel
        .find({ isFlagged: true, isDelete: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email image')
        .populate('bookId', 'title coverUrl')
        .lean(),
      this.postModel.countDocuments({ isFlagged: true, isDelete: false }),
    ]);

    return {
      items: posts,
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
      throw new BadRequestException('Invalid Post ID');

    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    if (!post.isFlagged) {
      throw new BadRequestException('Post is not flagged');
    }

    post.isFlagged = false;
    post.moderationStatus = 'approved';
    post.updatedAt = new Date();
    await post.save();

    return { success: true, message: 'Post approved successfully' };
  }

  async rejectPost(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid Post ID');

    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    // Hard delete the rejected post
    await this.postModel.deleteOne({ _id: id });

    return { success: true, message: 'Post rejected and deleted' };
  }
}
