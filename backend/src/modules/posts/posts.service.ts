import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '@/src/modules/posts/schemas/post.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { BooksService } from '../books/books.service';
import { Book, BookDocument } from '../books/schemas/book.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private cloudinaryService: CloudinaryService,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async create(createPostDto: CreatePostDto, files?: Express.Multer.File[]) {
    if (!Types.ObjectId.isValid(createPostDto.bookId)) {
      throw new BadRequestException('Invalid bookId format');
    }

    const book = await this.bookModel
      .findById(createPostDto.bookId)
      .select('coverUrl')
      .lean()
      .exec();

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Upload nhiều ảnh lên Cloudinary
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.cloudinaryService.uploadMultipleImages(files);
    }

    console.log(imageUrls);

    const created = new this.postModel({
      ...createPostDto,
      userId: new Types.ObjectId(createPostDto.userId),
      bookId: new Types.ObjectId(createPostDto.bookId),
      imageUrls: [...imageUrls], // Lưu array URLs
    });

    const saved = await created.save();

    return {
      _id: saved._id.toString(), // Rõ ràng là convert sang string
      userId: saved.userId.toString(),
      bookId: saved.bookId.toString(),
      content: saved.content,
      imageUrls: saved.imageUrls,
      isDelete: saved.isDelete,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postModel
        .find({ isDelete: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', '_id name email image')
        .populate({
          path: 'bookId',
          select: 'title coverUrl',
          populate: {
            path: 'authorId',
            select: 'name bio',
          },
        })
        .lean()
        .exec(),
      this.postModel.countDocuments({ isDelete: false }),
    ]);

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const post = await this.postModel
      .findOne({ _id: id, isDelete: false })
      .populate('userId', 'name email image')
      .populate({
        path: 'bookId',
        select: 'title coverUrl',
        populate: {
          path: 'authorId',
          select: 'name bio',
        },
      })
      .lean()
      .exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    files?: Express.Multer.File[],
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const post = await this.postModel.findOne({ _id: id, isDelete: false });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Nếu có upload ảnh mới
    let newImageUrls: string[] = [];
    if (files && files.length > 0) {
      newImageUrls = await this.cloudinaryService.uploadMultipleImages(files);
    }

    // Update các trường
    if (updatePostDto.content !== undefined) {
      post.content = updatePostDto.content;
    }

    // Xử lý khi đổi sách
    if (updatePostDto.bookId) {
      if (!Types.ObjectId.isValid(updatePostDto.bookId)) {
        throw new BadRequestException('Invalid bookId format');
      }

      const newBook = await this.bookModel
        .findById(updatePostDto.bookId)
        .select('coverUrl')
        .lean()
        .exec();

      if (!newBook) {
        throw new NotFoundException('Book not found');
      }

      post.bookId = new Types.ObjectId(updatePostDto.bookId);
    }

    // Xử lý imageUrls
    let finalImageUrls: string[];
    if (newImageUrls.length > 0) {
      finalImageUrls = [...post.imageUrls, ...newImageUrls];
    } else {
      // Không có thay đổi gì: Giữ nguyên
      finalImageUrls = post.imageUrls;
    }

    post.imageUrls = finalImageUrls;
    post.updatedAt = new Date();
    const updated = await post.save();

    return {
      id: updated._id.toString(),
      userId: updated.userId.toString(),
      bookId: updated.bookId.toString(),
      content: updated.content,
      imageUrls: updated.imageUrls,
      isDelete: updated.isDelete,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Soft delete
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const post = await this.postModel.findOne({ _id: id, isDelete: false });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.isDelete = true;
    post.updatedAt = new Date();
    await post.save();

    return {
      message: 'Post deleted successfully',
      id: post._id.toString(),
    };
  }

  // Hard delete (xóa hẳn khỏi DB - optional)
  async removeHard(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const result = await this.postModel.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Post not found');
    }

    return {
      message: 'Post permanently deleted',
    };
  }

  // Xóa một ảnh cụ thể trong post
  async removeImage(postId: string, imageUrl: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const post = await this.postModel.findOne({ _id: postId, isDelete: false });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Xóa URL khỏi array
    post.imageUrls = post.imageUrls.filter((url) => url !== imageUrl);
    post.updatedAt = new Date();
    await post.save();

    // Xóa ảnh trên Cloudinary (optional)
    try {
      await this.cloudinaryService.deleteImage(imageUrl);
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
    }

    return {
      message: 'Image removed successfully',
      imageUrls: post.imageUrls,
    };
  }
}
