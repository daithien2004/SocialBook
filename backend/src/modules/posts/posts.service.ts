import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '@/src/modules/posts/schemas/post.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto,
    files?: Express.Multer.File[],
  ): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(createPostDto.bookId)) {
      throw new BadRequestException('Invalid bookId format');
    }

    // Upload nhiều ảnh lên Cloudinary
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.cloudinaryService.uploadMultipleImages(files);
    }

    const created = new this.postModel({
      ...createPostDto,
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(createPostDto.bookId),
      imageUrls, // Lưu array URLs
    });

    return created.save();
  }

  async findByUser(userId: string): Promise<PostDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format');
    }

    return this.postModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(): Promise<PostDocument[]> {
    return this.postModel.find().sort({ createdAt: -1 }).exec();
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
