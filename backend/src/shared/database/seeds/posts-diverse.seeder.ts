import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Post,
  PostDocument,
} from '@/infrastructure/database/schemas/post.schema';
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

interface PostSeedData {
  userId: Types.ObjectId;
  bookId?: Types.ObjectId;
  content: string;
  imageUrls: string[];
  moderationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

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
export class PostsDiverseSeed {
  private readonly logger = new Logger(PostsDiverseSeed.name);

  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('📝 Seeding diverse posts with comments...');

    const existingPosts = await this.postModel.countDocuments();
    if (existingPosts > 0) {
      this.logger.log(`🗑️ Deleting ${existingPosts} existing posts...`);
      await this.commentModel.deleteMany({ targetType: 'post' });
      await this.postModel.deleteMany({});
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

    const chapters = await this.chapterModel
      .find()
      .sort({ orderIndex: 1 })
      .exec();

    const randomUser = () =>
      users[Math.floor(Math.random() * users.length)]._id;
    const randomDate = (daysBack: number) =>
      new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000);

    const discussionTemplates = [
      'Vừa đọc xong một cuốn sách tuyệt vời! Cảm xúc vẫn còn nguyên vẹn. Mọi người có gợi ý gì hay không?',
      'Cuối tuần rảnh rỗi, định đọc thử thể loại mới. Ai recommend vài cuốn hay với!',
      'Không biết mọi người có thói quen đọc sách gì đặc biệt không? Mình thì thích đọc trước khi ngủ.',
      'Đang đọc dở cuốn này, thấy hay quá nên muốn chia sẻ với mọi người!',
      'Sách giấy hay ebook? Mình thích sách giấy hơn vì cảm giác cầm trên tay.',
      'Mới khám phá ra một tác giả mới, viết rất hợp gu mình!',
      'Có ai trong group đọc thể loại Sci-fi không? Cho mình xin ít recommend với!',
      'Mình đang tìm kiếm một cuốn sách về chủ đề tình bạn, ai có gợi ý hay không?',
      'Cuốn sách này thay đổi hoàn toàn quan điểm sống của mình, nhất định phải đọc!',
      'Cả nhà có thấy tác giả này viết về tình yêu rất chân thật không? Mình đọc mà xúc động.',
    ];

    const posts: PostSeedData[] = [];
    const comments: CommentSeedData[] = [];
    const replies: CommentSeedData[] = [];
    for (const user of users) {
      const numDiscussionPosts = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numDiscussionPosts; i++) {
        const book = books[Math.floor(Math.random() * books.length)];
        posts.push({
          userId: user._id,
          bookId: book._id,
          content:
            discussionTemplates[
              Math.floor(Math.random() * discussionTemplates.length)
            ],
          imageUrls: [],
          moderationStatus: 'approved',
          createdAt: randomDate(14),
          updatedAt: new Date(),
        });
      }
    }

    if (chapters.length > 0) {
      const numParagraphPosts = Math.min(chapters.length, 15);
      const shuffledChapters = [...chapters].sort(() => Math.random() - 0.5);
      const usedChapters = shuffledChapters.slice(0, numParagraphPosts);

      for (const chapter of usedChapters) {
        if (!chapter.paragraphs || chapter.paragraphs.length === 0) continue;

        const paraContent = chapter.paragraphs[0].content || '';
        if (!paraContent) continue;

        const truncated =
          paraContent.length > 200
            ? paraContent.substring(0, 200) + '...'
            : paraContent;

        posts.push({
          userId: randomUser(),
          bookId: chapter.bookId,
          content: `"${truncated}" — Đoạn văn này hay quá mọi người ơi!`,
          imageUrls: [],
          moderationStatus: 'approved',
          createdAt: randomDate(10),
          updatedAt: new Date(),
        });
      }
    }

    const insertedPosts = await this.postModel.insertMany(posts);
    this.logger.log(`✅ Seeded ${insertedPosts.length} posts`);

    const postCommentTemplates = [
      'Bài viết hay quá, mình cũng có cùng suy nghĩ!',
      'Cảm ơn bạn đã chia sẻ, mình sẽ thử đọc cuốn này.',
      'Mình đã đọc cuốn này rồi, đúng là rất đáng đọc!',
      'Quan điểm của bạn rất thú vị, mình chưa nghĩ tới hướng đó.',
      'Đoạn trích này đẹp quá, mình cũng thích đoạn này!',
      'Tuyệt vời! Bạn có recommend thêm cuốn nào tương tự không?',
      'Mình đồng ý, cuốn này xứng đáng được nhiều người biết đến hơn.',
    ];

    for (const post of insertedPosts) {
      const numPostComments = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < numPostComments; i++) {
        const commentData: CommentSeedData = {
          userId: randomUser(),
          targetType: 'post',
          targetId: post._id,
          parentId: null,
          content:
            postCommentTemplates[
              Math.floor(Math.random() * postCommentTemplates.length)
            ],
          likesCount: Math.floor(Math.random() * 30),
          moderationStatus: 'approved',
          createdAt: new Date(
            post.createdAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000,
          ),
          updatedAt: new Date(),
        };
        comments.push(commentData);
      }
    }

    const insertedComments = await this.commentModel.insertMany(comments);
    this.logger.log(`✅ Seeded ${insertedComments.length} post comments`);

    const replyTemplates = [
      'Mình cũng nghĩ vậy! Cảm ơn bạn.',
      'Đồng ý, đúng là cuốn sách tuyệt vời.',
      'Chuẩn luôn, mình đọc cũng thấy y hệt.',
      'Cảm ơn bạn đã chia sẻ cảm nhận!',
      'Mình sẽ add vào list đọc ngay đây.',
    ];

    const toReply = insertedComments.slice(
      0,
      Math.min(25, insertedComments.length),
    );
    for (const parent of toReply) {
      const numReplies = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numReplies; i++) {
        replies.push({
          userId: randomUser(),
          targetType: 'post',
          targetId: parent.targetId,
          parentId: parent._id,
          content:
            replyTemplates[Math.floor(Math.random() * replyTemplates.length)],
          likesCount: Math.floor(Math.random() * 10),
          moderationStatus: 'approved',
          createdAt: new Date(
            parent.createdAt.getTime() +
              Math.random() * 2 * 24 * 60 * 60 * 1000,
          ),
          updatedAt: new Date(),
        });
      }
    }

    if (replies.length > 0) {
      await this.commentModel.insertMany(replies);
    }

    this.logger.log(
      `✅ Seeded ${replies.length} replies — total ${insertedPosts.length} posts + ${insertedComments.length + replies.length} comments`,
    );
  }
}
