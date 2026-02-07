import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Comment,
  CommentDocument,
} from '@/src/modules/comments/infrastructure/schemas/comment.schema';
import { Book, BookDocument } from '@/src/modules/books/infrastructure/schemas/book.schema';
import {
  Chapter,
  ChapterDocument,
  ParagraphDocument,
} from '@/src/modules/chapters/infrastructure/schemas/chapter.schema';

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

      // 🆕 Comments cho paragraphs trong chapter
      if (chapter.paragraphs && chapter.paragraphs.length > 0) {
        const numParagraphsToComment = Math.min(2, chapter.paragraphs.length);

        // Sử dụng toObject() để lấy plain object với _id
        const chapterObj = chapter.toObject();
        const paragraphsToComment = chapterObj.paragraphs.slice(
          0,
          numParagraphsToComment,
        );

        for (const paragraph of paragraphsToComment) {
          const numComments = Math.floor(Math.random() * 2) + 1;

          for (let i = 0; i < numComments; i++) {
            comments.push({
              userId:
                fakeUserIds[Math.floor(Math.random() * fakeUserIds.length)],
              targetType: 'paragraph',
              targetId: paragraph._id, // ✅ TypeScript hiểu _id tồn tại
              parentId: null,
              content: this.getRandomParagraphCommentContent(),
              likesCount: Math.floor(Math.random() * 30),
              createdAt: new Date(
                Date.now() - Math.random() * 8 * 24 * 60 * 60 * 1000,
              ),
              updatedAt: new Date(),
            });
          }
        }
      }
    }

    // Insert tất cả comments
    const insertedComments = await this.commentModel.insertMany(comments);

    // Tạo thêm một số reply comments với parentId hợp lệ
    const replyComments: any[] = [];
    const parentComments = insertedComments.slice(0, 15);

    for (const parentComment of parentComments) {
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

  private getRandomParagraphCommentContent(): string {
    const paragraphComments = [
      'Đoạn này viết rất hay, mình đọc đi đọc lại mấy lần!',
      'Chi tiết này thật thú vị, không ngờ tác giả lại viết như vậy.',
      'Phần miêu tả ở đoạn này rất sinh động!',
      'Mình thích cách tác giả diễn đạt ở đoạn này.',
      'Đoạn văn này chạm đến cảm xúc của mình quá!',
      'Câu chữ ở đây thật tuyệt vời!',
      'Đọc đến đoạn này mình phải dừng lại suy nghĩ.',
      'Tác giả dùng từ rất tinh tế ở đoạn này.',
      'Ấn tượng với cách miêu tả trong đoạn văn này!',
      'Đoạn này là một trong những đoạn hay nhất!',
    ];

    return paragraphComments[
      Math.floor(Math.random() * paragraphComments.length)
    ];
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
