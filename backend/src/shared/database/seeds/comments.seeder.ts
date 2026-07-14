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

interface CommentSeedData {
  userId: Types.ObjectId;
  targetType: string;
  targetId: Types.ObjectId;
  parentId: Types.ObjectId | null;
  content: string;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CommentsSeed {
  private readonly logger = new Logger(CommentsSeed.name);

  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('💬 Seeding comments...');

    const existingCount = await this.commentModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(
        `⚠️ Found ${existingCount} existing comments. Skipping...`,
      );
      return;
    }

    const users = await this.userModel.find();
    const chapters = await this.chapterModel.find().limit(20);

    if (users.length === 0 || chapters.length === 0) {
      this.logger.error('❌ Users or chapters not found.');
      return;
    }

    const comments: CommentSeedData[] = [];

    const chapterCommentTemplates = [
      'Chương này viết hay quá, cảm xúc được đẩy lên cao trào!',
      'Không thể chờ đợi để đọc chương tiếp theo!',
      'Mình thích cách tác giả miêu tả tâm lý nhân vật.',
      'Chương này có nhiều tình tiết bất ngờ quá!',
      'Đọc xong chương này mình suy nghĩ cả buổi.',
      'Tác giả viết rất chi tiết và cuốn hút.',
      'Nhân vật chính ngày càng trưởng thành, thích quá!',
      'Mình đã đọc đi đọc lại chương này mấy lần.',
    ];

    const paragraphCommentTemplates = [
      'Đoạn này viết rất hay!',
      'Chi tiết thú vị, không ngờ lại như vậy.',
      'Miêu tả rất sinh động và chân thật.',
      'Đoạn văn này chạm đến cảm xúc của mình.',
      'Tác giả dùng từ rất tinh tế.',
    ];

    const replyTemplates = [
      'Mình đồng ý với bạn!',
      'Đúng vậy, phần này viết rất hay!',
      'Cảm ơn bạn đã chia sẻ!',
      'Mình cũng có suy nghĩ tương tự.',
      'Ý kiến rất hay!',
    ];

    for (const chapter of chapters) {
      const numComments = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < numComments; i++) {
        comments.push({
          userId: users[Math.floor(Math.random() * users.length)]._id,
          targetType: 'chapter',
          targetId: chapter._id,
          parentId: null,
          content:
            chapterCommentTemplates[
              Math.floor(Math.random() * chapterCommentTemplates.length)
            ],
          likesCount: Math.floor(Math.random() * 60),
          createdAt: new Date(
            Date.now() - Math.random() * 18 * 24 * 60 * 60 * 1000,
          ),
          updatedAt: new Date(),
        });
      }

      if (chapter.paragraphs && chapter.paragraphs.length > 0) {
        const chapterObj = chapter.toObject();
        const paraCount = Math.min(2, chapter.paragraphs.length);
        const targetParagraphs = chapterObj.paragraphs.slice(0, paraCount) as {
          _id: Types.ObjectId;
        }[];

        for (const para of targetParagraphs) {
          comments.push({
            userId: users[Math.floor(Math.random() * users.length)]._id,
            targetType: 'paragraph',
            targetId: para._id,
            parentId: null,
            content:
              paragraphCommentTemplates[
                Math.floor(Math.random() * paragraphCommentTemplates.length)
              ],
            likesCount: Math.floor(Math.random() * 30),
            createdAt: new Date(
              Date.now() - Math.random() * 8 * 24 * 60 * 60 * 1000,
            ),
            updatedAt: new Date(),
          });
        }
      }
    }

    const inserted = await this.commentModel.insertMany(comments);

    const replies: CommentSeedData[] = [];
    const toReply = inserted.slice(0, Math.min(20, inserted.length));
    for (const parent of toReply) {
      const numReplies = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numReplies; i++) {
        replies.push({
          userId: users[Math.floor(Math.random() * users.length)]._id,
          targetType: parent.targetType,
          targetId: parent.targetId,
          parentId: parent._id,
          content:
            replyTemplates[Math.floor(Math.random() * replyTemplates.length)],
          likesCount: Math.floor(Math.random() * 15),
          createdAt: new Date(
            parent.createdAt.getTime() +
              Math.random() * 5 * 24 * 60 * 60 * 1000,
          ),
          updatedAt: new Date(),
        });
      }
    }

    if (replies.length > 0) {
      await this.commentModel.insertMany(replies);
    }

    this.logger.log(`✅ Seeded ${comments.length + replies.length} comments`);
  }
}
