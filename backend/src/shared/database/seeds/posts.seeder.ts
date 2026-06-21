import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Post,
  PostDocument,
} from '@/infrastructure/database/schemas/post.schema';
import {
  User,
  UserDocument,
} from '@/infrastructure/database/schemas/user.schema';

interface PostSeedData {
  userId: Types.ObjectId;
  content: string;
  imageUrls: string[];
  moderationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PostsSeed {
  private readonly logger = new Logger(PostsSeed.name);

  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('📝 Seeding posts...');

    const existingCount = await this.postModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(`⚠️ Found ${existingCount} existing posts. Skipping...`);
      return;
    }

    const users = await this.userModel.find();
    if (users.length === 0) {
      this.logger.error('❌ Users not found.');
      return;
    }

    const postTemplates = [
      'Vừa đọc xong một cuốn sách tuyệt vời! Cảm xúc vẫn còn nguyên vẹn. Mọi người có gợi ý gì hay không?',
      'Cuối tuần rảnh rỗi, định đọc thử thể loại mới. Ai recommend vài cuốn hay với!',
      'Không biết mọi người có thói quen đọc sách gì đặc biệt không? Mình thì thích đọc trước khi ngủ.',
      'Đang đọc dở cuốn này, thấy hay quá nên muốn chia sẻ với mọi người!',
      'Sách giấy hay ebook? Mình thích sách giấy hơn vì cảm giác cầm trên tay.',
      'Mới khám phá ra một tác giả mới, viết rất hợp gu mình!',
      'Có ai trong group đọc thể loại Sci-fi không? Cho mình xin ít recommend với!',
    ];

    const posts: PostSeedData[] = [];
    for (const user of users) {
      const numPosts = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numPosts; i++) {
        posts.push({
          userId: user._id,
          content:
            postTemplates[Math.floor(Math.random() * postTemplates.length)],
          imageUrls: [],
          moderationStatus: 'approved',
          createdAt: new Date(
            Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000,
          ),
          updatedAt: new Date(),
        });
      }
    }

    await this.postModel.insertMany(posts);
    this.logger.log(`✅ Seeded ${posts.length} posts`);
  }
}
