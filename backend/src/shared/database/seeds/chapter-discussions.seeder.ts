import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Comment,
  CommentDocument,
} from '@/infrastructure/database/schemas/comment.schema';
import {
  Chapter,
  ChapterDocument,
} from '@/infrastructure/database/schemas/chapter.schema';
import {
  User,
  UserDocument,
} from '@/infrastructure/database/schemas/user.schema';
import {
  Book,
  BookDocument,
} from '@/infrastructure/database/schemas/book.schema';

interface CommentSeedData {
  userId: Types.ObjectId;
  targetType: string;
  targetId: Types.ObjectId;
  parentId: Types.ObjectId | null;
  content: string;
  likesCount: number;
  moderationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ChapterDiscussionsSeed {
  private readonly logger = new Logger(ChapterDiscussionsSeed.name);

  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('💬 Seeding chapter discussions...');

    const deleted = await this.commentModel.deleteMany({
      targetType: { $in: ['chapter', 'paragraph'] },
    });
    if (deleted.deletedCount > 0) {
      this.logger.log(
        `🗑️ Deleted ${deleted.deletedCount} old chapter/paragraph comments`,
      );
    }

    const users = await this.userModel.find();
    if (users.length === 0) {
      this.logger.error('❌ Users not found.');
      return;
    }

    const books = await this.bookModel.find().exec();
    if (books.length === 0) {
      this.logger.error('❌ Books not found.');
      return;
    }

    const chapters: ChapterDocument[] = [];
    for (const book of books) {
      const chapter = await this.chapterModel
        .findOne({ bookId: book._id })
        .sort({ orderIndex: -1 })
        .exec();
      if (chapter) chapters.push(chapter);
    }

    if (chapters.length === 0) {
      this.logger.error('❌ No chapters found for any book.');
      return;
    }

    this.logger.log(
      `📚 Found ${chapters.length} latest chapters across ${books.length} books`,
    );

    const randomUser = () =>
      users[Math.floor(Math.random() * users.length)]._id;
    const randomDate = (daysBack: number) =>
      new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000);

    const chapterTemplates = [
      'Chương mới nhất hay quá! Tình tiết ngày càng hấp dẫn, không thể ngừng đọc được.',
      'Không ngờ kết thúc chương này lại bất ngờ như vậy! Tác giả đúng là bậc thầy về cliffhanger.',
      'Mình thích cách tác giả đẩy cảm xúc ở chương này, đọc mà hồi hộp từ đầu tới cuối.',
      'Chương này có nhiều chi tiết ẩn quá, chắc phải đọc lại lần nữa mới hiểu hết được.',
      'Cảm xúc dâng trào khi đọc xong chương này. Tác giả viết về tâm lý nhân vật rất chân thật.',
      'Mọi người đoán được diễn biến tiếp theo không? Mình nghĩ sắp có bước ngoặt lớn rồi!',
      'Đây là một trong những chương hay nhất từ đầu truyện đến giờ. Đẳng cấp!',
      'Đọc chương này mới thấy tác giả đầu tư quá nhiều về mặt cảm xúc, thực sự xuất sắc.',
      'Chương mới vừa hài vừa xúc động, tác giả cân bằng cảm xúc rất tốt.',
      'Lượng thông tin trong chương này dày đặc, nhưng đọc rất cuốn, không bị rối chút nào.',
    ];

    const paragraphTemplates = [
      'Đoạn này miêu tả rất sống động, mình như thấy được khung cảnh trước mắt.',
      'Một câu thoại đắt giá! Đáng suy ngẫm thật sự.',
      'Cách dùng từ trong đoạn này rất tinh tế, cho thấy vốn văn chương sâu rộng.',
      'Đoạn này khiến mình nhớ đến một trải nghiệm tương tự trong cuộc sống.',
      'Ẩn dụ trong đoạn văn này thật sự sâu sắc, phải ngẫm mới thấy hết ý nghĩa.',
    ];

    const replyTemplates = [
      'Mình cũng nghĩ vậy! Chương này đúng là đỉnh nhất từ đầu đến giờ.',
      'Đồng ý với bạn, tác giả viết đoạn này rất có chiều sâu.',
      'Cảm ơn bạn đã chia sẻ cảm nhận, mình đọc cũng thấy y hệt.',
      'Bạn nói chuẩn quá, phần này mình đọc đi đọc lại mấy lần vì thích.',
      'Hoàn toàn đồng quan điểm! Mong chờ chương sau quá.',
    ];

    const comments: CommentSeedData[] = [];
    const allReplies: CommentSeedData[] = [];

    for (const chapter of chapters) {
      const numChapterComments = Math.floor(Math.random() * 3) + 5;

      const chapterCommentIds: Types.ObjectId[] = [];

      for (let i = 0; i < numChapterComments; i++) {
        const commentId = new Types.ObjectId();
        chapterCommentIds.push(commentId);

        const comment: CommentSeedData = {
          userId: randomUser(),
          targetType: 'chapter',
          targetId: chapter._id,
          parentId: null,
          content:
            chapterTemplates[
              Math.floor(Math.random() * chapterTemplates.length)
            ],
          likesCount: Math.floor(Math.random() * 80),
          moderationStatus: 'approved',
          createdAt: randomDate(14),
          updatedAt: new Date(),
        };
        comments.push(comment);
      }

      if (chapter.paragraphs && chapter.paragraphs.length > 0) {
        const paraCount = Math.min(2, chapter.paragraphs.length);
        const targetParagraphs = chapter.paragraphs.slice(0, paraCount);

        for (const para of targetParagraphs) {
          comments.push({
            userId: randomUser(),
            targetType: 'paragraph',
            targetId: para._id,
            parentId: null,
            content:
              paragraphTemplates[
                Math.floor(Math.random() * paragraphTemplates.length)
              ],
            likesCount: Math.floor(Math.random() * 40),
            moderationStatus: 'approved',
            createdAt: randomDate(10),
            updatedAt: new Date(),
          });
        }
      }
    }

    const inserted = await this.commentModel.insertMany(comments);
    this.logger.log(`✅ Seeded ${inserted.length} top-level comments`);

    const toReply = inserted.slice(0, Math.min(30, inserted.length));
    for (const parent of toReply) {
      const numReplies = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numReplies; i++) {
        allReplies.push({
          userId: randomUser(),
          targetType: parent.targetType,
          targetId: parent.targetId,
          parentId: parent._id,
          content:
            replyTemplates[Math.floor(Math.random() * replyTemplates.length)],
          likesCount: Math.floor(Math.random() * 20),
          moderationStatus: 'approved',
          createdAt: new Date(
            parent.createdAt.getTime() +
              Math.random() * 5 * 24 * 60 * 60 * 1000,
          ),
          updatedAt: new Date(),
        });
      }
    }

    if (allReplies.length > 0) {
      await this.commentModel.insertMany(allReplies);
    }

    this.logger.log(
      `✅ Seeded ${allReplies.length} replies — total ${inserted.length + allReplies.length} comments for chapter discussions`,
    );
  }
}
