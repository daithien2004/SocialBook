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
      imageUrls: [...imageUrls, book.coverUrl], // Lưu array URLs
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

  async findAll(): Promise<PostDocument[]> {
    return this.postModel.find().sort({ createdAt: -1 }).exec();
  }
}
