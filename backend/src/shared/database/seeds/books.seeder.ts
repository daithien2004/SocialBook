import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from '@/src/modules/books/schemas/book.schema';
import {
  Author,
  AuthorDocument,
} from '@/src/modules/authors/schemas/author.schema';
import {
  Genre,
  GenreDocument,
} from '@/src/modules/genres/schemas/genre.schema';

@Injectable()
export class BooksSeed {
  private readonly logger = new Logger(BooksSeed.name);

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🔄 Seeding books...');

    const existingCount = await this.bookModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(`⚠️ Found ${existingCount} existing books. Skipping...`);
      return;
    }

    // Lấy authors và genres
    const authors = await this.authorModel.find();
    const genres = await this.genreModel.find();

    if (authors.length === 0 || genres.length === 0) {
      this.logger.error(
        '❌ No authors or genres found. Please seed them first.',
      );
      return;
    }

    // Helper function để tìm author và genre theo tên
    const findAuthor = (name: string) =>
      authors.find((a) => a.name === name)?._id;
    const findGenres = (names: string[]) =>
      genres.filter((g) => names.includes(g.name)).map((g) => g._id);

    const books = [
      {
        authorId: findAuthor('Nguyễn Nhật Ánh'),
        genre: findGenres(['Tiểu thuyết', 'Văn học thiếu nhi', 'Lãng mạn']),
        title: 'Mắt Biếc',
        slug: 'mat-biec',
        publishedYear: '1990',
        description:
          'Truyện kể về tình yêu dang dở của Ngạn dành cho Hà Lan - cô bé hàng xóm với đôi mắt biếc trong veo.',
        coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
        status: 'completed',
        tags: ['tình yêu', 'tuổi thơ', 'kỷ niệm'],
        views: 15420,
        likes: 3240,
      },
      {
        authorId: findAuthor('Nguyễn Nhật Ánh'),
        genre: findGenres(['Tiểu thuyết', 'Văn học thiếu nhi']),
        title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
        slug: 'toi-thay-hoa-vang-tren-co-xanh',
        publishedYear: '2010',
        description:
          'Chuyện kể về tuổi thơ nghèo khó nhưng trong sáng của hai anh em Thiều và Tường.',
        coverUrl:
          'https://images.unsplash.com/photo-1512820790803-83ca734da794',
        status: 'completed',
        tags: ['tuổi thơ', 'anh em', 'nông thôn'],
        views: 28900,
        likes: 5670,
      },
      {
        authorId: findAuthor('Tô Hoài'),
        genre: findGenres(['Văn học thiếu nhi', 'Phiêu lưu']),
        title: 'Dế Mèn Phiêu Lưu Ký',
        slug: 'de-men-phieu-luu-ky',
        publishedYear: '1941',
        description:
          'Cuộc phiêu lưu đầy kỳ thú của chú dế mèn qua những vùng đất mới với bài học về tình bạn và lòng dũng cảm.',
        coverUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        status: 'completed',
        tags: ['phiêu lưu', 'thiếu nhi', 'kinh điển'],
        views: 12340,
        likes: 2890,
      },
      {
        authorId: findAuthor('Nam Cao'),
        genre: findGenres(['Truyện ngắn', 'Hiện thực']),
        title: 'Chi Phèo',
        slug: 'chi-pheo',
        publishedYear: '1941',
        description:
          'Tác phẩm hiện thực phê phán về số phận bi thảm của người nông dân nghèo khổ trong xã hội cũ.',
        coverUrl:
          'https://images.unsplash.com/photo-1495446815901-a7297e633e8d',
        status: 'completed',
        tags: ['hiện thực', 'xã hội', 'kinh điển'],
        views: 9870,
        likes: 1450,
      },
      {
        authorId: findAuthor('Nam Cao'),
        genre: findGenres(['Truyện ngắn', 'Hiện thực']),
        title: 'Lão Hạc',
        slug: 'lao-hac',
        publishedYear: '1943',
        description:
          'Câu chuyện cảm động về người lão nông nghèo khổ với tình thương dành cho đứa con trai và chú chó vàng.',
        coverUrl:
          'https://images.unsplash.com/photo-1532012197267-da84d127e765',
        status: 'completed',
        tags: ['hiện thực', 'tình cha con', 'cảm động'],
        views: 8560,
        likes: 1290,
      },
      {
        authorId: findAuthor('Ngô Tất Tố'),
        genre: findGenres(['Tiểu thuyết', 'Hiện thực']),
        title: 'Tắt Đèn',
        slug: 'tat-den',
        publishedYear: '1939',
        description:
          'Bức tranh chân thực về cuộc sống khốn khó của người nông dân Việt Nam đầu thế kỷ 20.',
        coverUrl:
          'https://images.unsplash.com/photo-1524578271613-d550eacf6090',
        status: 'completed',
        tags: ['hiện thực', 'nông thôn', 'xã hội'],
        views: 7890,
        likes: 1120,
      },
      {
        authorId: findAuthor('Vũ Trọng Phụng'),
        genre: findGenres(['Tiểu thuyết', 'Châm biếm']),
        title: 'Số Đỏ',
        slug: 'so-do',
        publishedYear: '1936',
        description:
          'Tác phẩm châm biếm sắc sảo về tình trạng tham nhũng và xã hội Hà Nội thời thuộc Pháp.',
        coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e',
        status: 'completed',
        tags: ['châm biếm', 'xã hội', 'Hà Nội'],
        views: 6740,
        likes: 980,
      },
      {
        authorId: findAuthor('Nguyễn Du'),
        genre: findGenres(['Thơ', 'Lãng mạn', 'Lịch sử']),
        title: 'Truyện Kiều',
        slug: 'truyen-kieu',
        publishedYear: '1820',
        description:
          'Kiệt tác văn học cổ điển kể về số phận đa đoan của Thúy Kiều trong xã hội phong kiến.',
        coverUrl:
          'https://images.unsplash.com/photo-1535905557558-afc4877a26fc',
        status: 'completed',
        tags: ['kinh điển', 'thơ', 'tình yêu', 'lịch sử'],
        views: 23450,
        likes: 4560,
      },
      {
        authorId: findAuthor('Xuân Diệu'),
        genre: findGenres(['Thơ', 'Lãng mạn']),
        title: 'Thơ Tình Xuân Diệu',
        slug: 'tho-tinh-xuan-dieu',
        publishedYear: '1938',
        description:
          'Tuyển tập những bài thơ tình nồng nàn, lãng mạn của "Vua thơ tình".',
        coverUrl:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570',
        status: 'completed',
        tags: ['thơ', 'tình yêu', 'lãng mạn'],
        views: 11230,
        likes: 2340,
      },
      {
        authorId: findAuthor('Tô Hữu'),
        genre: findGenres(['Thơ', 'Lịch sử']),
        title: 'Việt Bắc',
        slug: 'viet-bac',
        publishedYear: '1954',
        description:
          'Tập thơ ca ngợi vẻ đẹp thiên nhiên và con người Việt Bắc trong kháng chiến.',
        coverUrl:
          'https://images.unsplash.com/photo-1518770660439-4636190af475',
        status: 'completed',
        tags: ['thơ', 'cách mạng', 'thiên nhiên'],
        views: 5670,
        likes: 890,
      },
      {
        authorId: findAuthor('Hồ Xuân Hương'),
        genre: findGenres(['Thơ']),
        title: 'Thơ Hồ Xuân Hương',
        slug: 'tho-ho-xuan-huong',
        publishedYear: '1800',
        description:
          'Tuyển tập thơ táo bạo, đầy ẩn ý và phê phán xã hội phong kiến.',
        coverUrl:
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6',
        status: 'completed',
        tags: ['thơ', 'cổ điển', 'táo bạo'],
        views: 4560,
        likes: 720,
      },
      {
        authorId: findAuthor('Nguyễn Trãi'),
        genre: findGenres(['Thơ', 'Lịch sử']),
        title: 'Bình Ngô Đại Cáo',
        slug: 'binh-ngo-dai-cao',
        publishedYear: '1428',
        description:
          'Tác phẩm văn học và lịch sử vĩ đại tuyên bố độc lập của dân tộc Việt Nam.',
        coverUrl:
          'https://images.unsplash.com/photo-1516979187457-637abb4f9353',
        status: 'completed',
        tags: ['lịch sử', 'cổ điển', 'độc lập'],
        views: 3450,
        likes: 560,
      },
    ];

    await this.bookModel.insertMany(books);
    this.logger.log(`✅ Seeded ${books.length} books successfully!`);
  }
}
