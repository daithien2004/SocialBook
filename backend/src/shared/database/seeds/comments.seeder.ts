import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Comment,
  CommentDocument,
} from '@/src/modules/comments/schemas/comment.schema';
import { Book, BookDocument } from '@/src/modules/books/schemas/book.schema';
import {
  Chapter,
  ChapterDocument,
} from '@/src/modules/chapters/schemas/chapter.schema';

@Injectable()
export class CommentsSeed {
  private readonly logger = new Logger(CommentsSeed.name);

  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🔄 Seeding comments...');

    const existingCount = await this.commentModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(
        `⚠️ Found ${existingCount} existing comments. Skipping...`,
      );
      return;
    }

    const books = await this.bookModel.find().limit(5);
    const chapters = await this.chapterModel.find().limit(10);

    if (books.length === 0 && chapters.length === 0) {
      this.logger.error(
        '❌ No books or chapters found. Please seed them first.',
      );
      return;
    }

    const comments: any[] = [];

    // Tạo fake user IDs (trong production, bạn sẽ có user seeder)
    const fakeUserIds = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];

    // Comments cho books
    for (const book of books) {
      // Parent comments
      const parentComment1 = {
        userId: fakeUserIds[0],
        targetType: 'book',
        targetId: book._id,
        parentId: null,
        content:
          'Cuốn sách hay quá! Tôi đã đọc xong trong một ngày và không thể rời mắt.',
        likesCount: Math.floor(Math.random() * 100),
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      };
      comments.push(parentComment1);

      const parentComment2 = {
        userId: fakeUserIds[1],
        targetType: 'book',
        targetId: book._id,
        parentId: null,
        content:
          'Tác giả viết rất hay, cảm xúc được truyền tải một cách chân thật.',
        likesCount: Math.floor(Math.random() * 80),
        createdAt: new Date(
          Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      };
      comments.push(parentComment2);

      // Reply comments (sẽ cập nhật parentId sau khi insert)
      comments.push({
        userId: fakeUserIds[2],
        targetType: 'book',
        targetId: book._id,
        parentId: null, // Sẽ cập nhật sau
        content:
          'Mình cũng nghĩ vậy! Phong cách viết của tác giả rất cuốn hút.',
        likesCount: Math.floor(Math.random() * 50),
        createdAt: new Date(
          Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      });

      comments.push({
        userId: fakeUserIds[3],
        targetType: 'book',
        targetId: book._id,
        parentId: null,
        content: 'Đây là một trong những cuốn sách hay nhất mình từng đọc!',
        likesCount: Math.floor(Math.random() * 120),
        createdAt: new Date(
          Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      });
    }

    // Comments cho chapters
    for (const chapter of chapters) {
      comments.push({
        userId: fakeUserIds[0],
        targetType: 'chapter',
        targetId: chapter._id,
        parentId: null,
        content: 'Chương này viết hay quá, cảm xúc được đẩy lên cao trào!',
        likesCount: Math.floor(Math.random() * 60),
        createdAt: new Date(
          Date.now() - Math.random() * 18 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      });

      comments.push({
        userId: fakeUserIds[1],
        targetType: 'chapter',
        targetId: chapter._id,
        parentId: null,
        content:
          'Không thể chờ đợi để đọc chương tiếp theo! Tác giả update nhanh nhé!',
        likesCount: Math.floor(Math.random() * 45),
        createdAt: new Date(
          Date.now() - Math.random() * 12 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      });

      comments.push({
        userId: fakeUserIds[4],
        targetType: 'chapter',
        targetId: chapter._id,
        parentId: null,
        content:
          'Mình thích cách tác giả miêu tả tâm lý nhân vật. Rất chân thật!',
        likesCount: Math.floor(Math.random() * 70),
        createdAt: new Date(
          Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      });
    }

    // Insert tất cả comments
    const insertedComments = await this.commentModel.insertMany(comments);

    // Tạo thêm một số reply comments với parentId hợp lệ
    const replyComments: any[] = [];

    // Lấy một số parent comments để tạo replies
    const parentComments = insertedComments.slice(0, 10);

    for (const parentComment of parentComments) {
      // Tạo 1-2 replies cho mỗi parent comment
      const numReplies = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < numReplies; i++) {
        replyComments.push({
          userId: fakeUserIds[Math.floor(Math.random() * fakeUserIds.length)],
          targetType: parentComment.targetType,
          targetId: parentComment.targetId,
          parentId: parentComment._id,
          content: this.getRandomReplyContent(),
          likesCount: Math.floor(Math.random() * 30),
          createdAt: new Date(
            parentComment.createdAt.getTime() +
              Math.random() * 5 * 24 * 60 * 60 * 1000,
          ),
          updatedAt: new Date(),
        });
      }
    }

    if (replyComments.length > 0) {
      await this.commentModel.insertMany(replyComments);
    }

    this.logger.log(
      `✅ Seeded ${insertedComments.length + replyComments.length} comments successfully!`,
    );
  }

  private getRandomReplyContent(): string {
    const replyContents = [
      'Mình đồng ý với bạn!',
      'Đúng vậy, phần này viết rất hay!',
      'Cảm ơn bạn đã chia sẻ!',
      'Mình cũng có suy nghĩ tương tự.',
      'Bạn nói đúng đấy!',
      'Hay quá, mình cũng thích phần này!',
      'Ý kiến rất hay!',
      'Mình cũng đang mong chờ phần tiếp theo.',
      'Bạn đọc kỹ quá, mình không để ý chi tiết này!',
      'Cảm xúc được truyền tải rất tốt nhỉ!',
    ];

    return replyContents[Math.floor(Math.random() * replyContents.length)];
  }
}
