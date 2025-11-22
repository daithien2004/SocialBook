import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId) {
    // Kiểm tra xem user đã review sách này chưa (Dù DB có index unique, check ở code để trả lỗi rõ ràng hơn)
    const existingReview = await this.reviewModel.findOne({
      userId: userId,
      bookId: createReviewDto.bookId,
    });

    if (existingReview) {
      throw new ConflictException('Bạn đã đánh giá cuốn sách này rồi.');
    }

    try {
      const newReview = await this.reviewModel.create({
        ...createReviewDto,
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(createReviewDto.bookId),
      });

      return newReview.populate('userId', 'username image');
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Không thể tạo đánh giá.');
    }
  }

  async findAllByBook(bookId: string) {
    if (!Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid Book ID');
    }

    return this.reviewModel
      .find({ bookId: new Types.ObjectId(bookId) })
      .populate('userId', 'username image email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async update(id: string, userId: string, updateReviewDto: UpdateReviewDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Review ID');
    }

    const review = await this.reviewModel.findById(id);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa đánh giá này');
    }

    const updatedReview = await this.reviewModel
      .findByIdAndUpdate(id, updateReviewDto, { new: true })
      .populate('userId', 'username image');

    return updatedReview;
  }

  async remove(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Review ID');
    }

    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Quan trọng: Kiểm tra quyền sở hữu
    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.reviewModel.findByIdAndDelete(id);
    return { message: 'Xóa đánh giá thành công' };
  }

  async findOne(id: string) {
    return this.reviewModel.findById(id).populate('userId', 'username');
  }
}
