import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Author,
  AuthorDocument,
} from '@/src/modules/authors/schemas/author.schema';

@Injectable()
export class AuthorsSeed {
  private readonly logger = new Logger(AuthorsSeed.name);

  constructor(
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🔄 Seeding authors...');

    const authors = [
      {
        name: 'Nguyễn Nhật Ánh',
        bio: 'Nhà văn nổi tiếng Việt Nam, tác giả của nhiều tác phẩm văn học thiếu nhi và tuổi teen được yêu thích.',
      },
      {
        name: 'Tô Hoài',
        bio: 'Nhà văn lớn của văn học Việt Nam, được biết đến với tác phẩm Dế Mèn phiêu lưu ký.',
      },
      {
        name: 'Nam Cao',
        bio: 'Nhà văn hiện thực xuất sắc, tác giả của Chi Phèo, Lão Hạc và nhiều tác phẩm kinh điển khác.',
      },
      {
        name: 'Ngô Tất Tố',
        bio: 'Nhà văn hiện thực Việt Nam, tác giả của Tắt đèn - tác phẩm văn học hiện thực nổi tiếng.',
      },
      {
        name: 'Vũ Trọng Phụng',
        bio: 'Nhà văn nổi tiếng với phong cách châm biếm sắc sảo, tác giả Số đỏ, Dumb Luck.',
      },
      {
        name: 'Xuân Diệu',
        bio: 'Nhà thơ lớn của thơ ca Việt Nam hiện đại, được mệnh danh là "Vua thơ tình".',
      },
      {
        name: 'Tô Hữu',
        bio: 'Nhà thơ cách mạng Việt Nam, tác giả của nhiều bài thơ nổi tiếng về tình yêu đất nước.',
      },
      {
        name: 'Nguyễn Du',
        bio: 'Đại thi hào Việt Nam, tác giả Truyện Kiều - kiệt tác văn học cổ điển.',
      },
      {
        name: 'Hồ Xuân Hương',
        bio: 'Nữ thi sĩ tài hoa thời ph封kiến, nổi tiếng với phong cách thơ độc đáo và táo bạo.',
      },
      {
        name: 'Nguyễn Trãi',
        bio: 'Danh nhân văn hóa Việt Nam, tác giả Bình Ngô đại cáo và nhiều tác phẩm văn học quý giá.',
      },
    ];

    const existingCount = await this.authorModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(
        `⚠️ Found ${existingCount} existing authors. Skipping...`,
      );
      return;
    }

    await this.authorModel.insertMany(authors);
    this.logger.log(`✅ Seeded ${authors.length} authors successfully!`);
  }
}
