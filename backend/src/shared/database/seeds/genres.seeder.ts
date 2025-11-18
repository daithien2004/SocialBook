import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Genre,
  GenreDocument,
} from '@/src/modules/genres/schemas/genre.schema';

@Injectable()
export class GenresSeed {
  private readonly logger = new Logger(GenresSeed.name);

  constructor(
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🔄 Seeding genres...');

    const genres = [
      {
        name: 'Tiểu thuyết',
        description:
          'Thể loại văn học kể về một câu chuyện có cốt truyện phức tạp và phát triển nhân vật.',
      },
      {
        name: 'Truyện ngắn',
        description:
          'Tác phẩm văn xuôi ngắn gọn, tập trung vào một sự kiện hoặc nhân vật chính.',
      },
      {
        name: 'Thơ',
        description:
          'Thể loại văn học sử dụng ngôn ngữ có nhịp điệu và hình ảnh để diễn đạt cảm xúc.',
      },
      {
        name: 'Văn học thiếu nhi',
        description: 'Tác phẩm dành cho độc giả từ thiếu nhi đến tuổi teen.',
      },
      {
        name: 'Lãng mạn',
        description:
          'Thể loại tập trung vào tình yêu và mối quan hệ giữa các nhân vật.',
      },
      {
        name: 'Trinh thám',
        description:
          'Thể loại văn học xoay quanh việc giải quyết bí ẩn hoặc tội phạm.',
      },
      {
        name: 'Kinh dị',
        description:
          'Thể loại văn học nhằm tạo ra cảm giác sợ hãi, bất an cho người đọc.',
      },
      {
        name: 'Khoa học viễn tưởng',
        description:
          'Thể loại dựa trên khoa học và công nghệ tưởng tượng trong tương lai.',
      },
      {
        name: 'Huyền bí',
        description:
          'Thể loại chứa các yếu tố siêu nhiên, phép thuật và thế giới tưởng tượng.',
      },
      {
        name: 'Lịch sử',
        description:
          'Tác phẩm lấy bối cảnh hoặc dựa trên các sự kiện lịch sử có thật.',
      },
      {
        name: 'Phiêu lưu',
        description:
          'Thể loại kể về những cuộc hành trình và trải nghiệm mạo hiểm.',
      },
      {
        name: 'Hiện thực',
        description:
          'Thể loại phản ánh cuộc sống thực tế và xã hội một cách chân thực.',
      },
      {
        name: 'Châm biếm',
        description:
          'Thể loại sử dụng sự mỉa mai và hài hước để phê phán xã hội.',
      },
      {
        name: 'Tự truyện',
        description:
          'Tác phẩm kể về cuộc đời và trải nghiệm của chính tác giả.',
      },
      {
        name: 'Tâm lý',
        description:
          'Thể loại tập trung vào tâm lý, cảm xúc và nội tâm nhân vật.',
      },
    ];

    const existingCount = await this.genreModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(
        `⚠️ Found ${existingCount} existing genres. Skipping...`,
      );
      return;
    }

    await this.genreModel.insertMany(genres);
    this.logger.log(`✅ Seeded ${genres.length} genres successfully!`);
  }
}
