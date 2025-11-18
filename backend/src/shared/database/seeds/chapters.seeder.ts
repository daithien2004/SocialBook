import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Chapter,
  ChapterDocument,
} from '@/src/modules/chapters/schemas/chapter.schema';
import { Book, BookDocument } from '@/src/modules/books/schemas/book.schema';

@Injectable()
export class ChaptersSeed {
  private readonly logger = new Logger(ChaptersSeed.name);

  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🔄 Seeding chapters...');

    const existingCount = await this.chapterModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(
        `⚠️ Found ${existingCount} existing chapters. Skipping...`,
      );
      return;
    }

    const books = await this.bookModel.find();
    if (books.length === 0) {
      this.logger.error('❌ No books found. Please seed books first.');
      return;
    }

    const chapters: any[] = [];

    // Tạo chapters cho "Mắt Biếc"
    const matBiecBook = books.find((b) => b.slug === 'mat-biec');
    if (matBiecBook) {
      chapters.push(
        {
          bookId: matBiecBook._id,
          title: 'Chương 1: Hà Lan',
          slug: 'chuong-1-ha-lan',
          orderIndex: 1,
          viewsCount: 1240,
          paragraphs: [
            {
              id: '1',
              content:
                'Tôi còn nhớ như in cái ngày đầu tiên gặp Hà Lan. Đó là một buổi chiều nắng nhẹ, khi tôi đang ngồi trên cành cây ổi già sau vườn nhà.',
            },
            {
              id: '2',
              content:
                'Hà Lan xuất hiện như một thiên thần nhỏ, với mái tóc dài óng ả và đôi mắt biếc trong veo như màu trời thu.',
            },
            {
              id: '3',
              content:
                '"Chào anh!" - Giọng nói trong trẻo của em vang lên, làm tôi giật mình suýt té khỏi cành cây.',
            },
          ],
        },
        {
          bookId: matBiecBook._id,
          title: 'Chương 2: Tuổi Thơ Bên Nhau',
          slug: 'chuong-2-tuoi-tho-ben-nhau',
          orderIndex: 2,
          viewsCount: 980,
          paragraphs: [
            {
              id: '1',
              content:
                'Những ngày tháng tuổi thơ trôi qua êm đềm bên Hà Lan. Chúng tôi cùng nhau đi học, cùng nhau chơi đùa dưới bóng cây sau vườn.',
            },
            {
              id: '2',
              content:
                'Tôi nhớ mãi những buổi chiều mưa rơi, khi Hà Lan và tôi cùng trú dưới mái hiên nhà, nghe tiếng mưa gõ nhịp trên mái tôn.',
            },
            {
              id: '3',
              content:
                'Hà Lan thích ngắm mưa và kể cho tôi nghe những câu chuyện tưởng tượng về những giọt mưa đang rơi.',
            },
          ],
        },
        {
          bookId: matBiecBook._id,
          title: 'Chương 3: Những Thay Đổi',
          slug: 'chuong-3-nhung-thay-doi',
          orderIndex: 3,
          viewsCount: 856,
          paragraphs: [
            {
              id: '1',
              content:
                'Thời gian trôi qua, chúng tôi lớn lên. Hà Lan ngày càng xinh đẹp, và tôi bắt đầu nhận ra rằng tình cảm của mình dành cho em không chỉ đơn thuần là tình bạn thời thơ ấu.',
            },
            {
              id: '2',
              content:
                'Nhưng số phận dường như đã có những sắp đặt khác. Gia đình Hà Lan gặp khó khăn, và những khoảng cách bắt đầu xuất hiện giữa chúng tôi.',
            },
          ],
        },
      );
    }

    // Tạo chapters cho "Tôi Thấy Hoa Vàng Trên Cỏ Xanh"
    const hoaVangBook = books.find(
      (b) => b.slug === 'toi-thay-hoa-vang-tren-co-xanh',
    );
    if (hoaVangBook) {
      chapters.push(
        {
          bookId: hoaVangBook._id,
          title: 'Chương 1: Những Ngày Đầu',
          slug: 'chuong-1-nhung-ngay-dau',
          orderIndex: 1,
          viewsCount: 2140,
          paragraphs: [
            {
              id: '1',
              content:
                'Tôi là Thiều, sống cùng em trai Tường trong một ngôi làng nhỏ yên bình. Gia đình chúng tôi nghèo khó nhưng luôn tràn đầy tiếng cười.',
            },
            {
              id: '2',
              content:
                'Em tôi, Tường, là một đứa trẻ hiền lành và nhạy cảm. Em thích chăm sóc những con vật nhỏ và luôn quan tâm đến mọi người xung quanh.',
            },
          ],
        },
        {
          bookId: hoaVangBook._id,
          title: 'Chương 2: Cô Gái Bên Nhà',
          slug: 'chuong-2-co-gai-ben-nha',
          orderIndex: 2,
          viewsCount: 1890,
          paragraphs: [
            {
              id: '1',
              content:
                'Nhà bên cạnh có một cô gái xinh đẹp tên Mận. Cô ấy lớn hơn chúng tôi vài tuổi và luôn tỏa ra một vẻ đẹp dịu dàng, trong sáng.',
            },
            {
              id: '2',
              content:
                'Tôi và Tường đều thầm thích Mận, nhưng tình cảm của hai anh em dành cho cô ấy lại khác nhau. Điều này sau này đã tạo nên những hiểu lầm đau lòng.',
            },
          ],
        },
      );
    }

    // Tạo chapters cho "Dế Mèn Phiêu Lưu Ký"
    const deMenBook = books.find((b) => b.slug === 'de-men-phieu-luu-ky');
    if (deMenBook) {
      chapters.push(
        {
          bookId: deMenBook._id,
          title: 'Chương 1: Cuộc Sống Ở Đồng Cỏ',
          slug: 'chuong-1-cuoc-song-o-dong-co',
          orderIndex: 1,
          viewsCount: 1560,
          paragraphs: [
            {
              id: '1',
              content:
                'Dế Mèn sinh ra và lớn lên trong một đồng cỏ xanh mướt. Cuộc sống ở đây yên bình nhưng cũng đầy thử thách.',
            },
            {
              id: '2',
              content:
                'Chú dế nhỏ luôn tò mò về thế giới bên ngoài và mơ ước được khám phá những vùng đất mới.',
            },
          ],
        },
        {
          bookId: deMenBook._id,
          title: 'Chương 2: Cuộc Phiêu Lưu Bắt Đầu',
          slug: 'chuong-2-cuoc-phieu-luu-bat-dau',
          orderIndex: 2,
          viewsCount: 1340,
          paragraphs: [
            {
              id: '1',
              content:
                'Một ngày nọ, Dế Mèn quyết định rời khỏi quê hương để bắt đầu cuộc hành trình phiêu lưu. Chú mang theo những bài học mà cha mẹ đã dạy.',
            },
            {
              id: '2',
              content:
                'Trên đường đi, chú gặp gỡ nhiều sinh vật kỳ lạ: dế cậu, bọ cánh cứng, kiến đỏ... Mỗi cuộc gặp gỡ đều mang đến cho chú một bài học quý giá về cuộc sống.',
            },
          ],
        },
      );
    }

    // Tạo chapters cho "Chi Phèo"
    const chiPheoBook = books.find((b) => b.slug === 'chi-pheo');
    if (chiPheoBook) {
      chapters.push(
        {
          bookId: chiPheoBook._id,
          title: 'Chương 1: Chi Phèo',
          slug: 'chuong-1-chi-pheo',
          orderIndex: 1,
          viewsCount: 780,
          paragraphs: [
            {
              id: '1',
              content:
                'Chi Phèo không phải là một con người như mọi người. Anh ta là một người bị xã hội ruồng bỏ, sống ngoài lề đạo đức và pháp luật.',
            },
            {
              id: '2',
              content:
                'Nhưng Chi Phèo không sinh ra đã như vậy. Có một thời anh cũng là người nông dân lương thiện, chỉ vì hoàn cảnh và xã hội đẩy đưa mà anh trở thành kẻ xấu xa.',
            },
          ],
        },
        {
          bookId: chiPheoBook._id,
          title: 'Chương 2: Thị Nở',
          slug: 'chuong-2-thi-no',
          orderIndex: 2,
          viewsCount: 650,
          paragraphs: [
            {
              id: '1',
              content:
                'Thị Nở cũng là một người phụ nữ có số phận bi thảm không kém Chi Phèo. Bà là người duy nhất không xa lánh Chi Phèo.',
            },
            {
              id: '2',
              content:
                'Tình cảm giữa Chi Phèo và Thị Nở là mối quan hệ phức tạp của hai con người cùng chung số phận, cùng bị xã hội ruồng bỏ.',
            },
          ],
        },
      );
    }

    // Tạo chapters cho "Truyện Kiều"
    const truyenKieuBook = books.find((b) => b.slug === 'truyen-kieu');
    if (truyenKieuBook) {
      chapters.push(
        {
          bookId: truyenKieuBook._id,
          title: 'Đoạn 1: Lời Mở Đầu',
          slug: 'doan-1-loi-mo-dau',
          orderIndex: 1,
          viewsCount: 3240,
          paragraphs: [
            {
              id: '1',
              content:
                'Trăm năm trong cõi người ta, chữ tài chữ mệnh khéo là ghét nhau.',
            },
            {
              id: '2',
              content:
                'Trải qua một cuộc bể dâu, những điều trông thấy mà đau đớn lòng.',
            },
          ],
        },
        {
          bookId: truyenKieuBook._id,
          title: 'Đoạn 2: Thúy Kiều',
          slug: 'doan-2-thuy-kieu',
          orderIndex: 2,
          viewsCount: 2890,
          paragraphs: [
            {
              id: '1',
              content:
                'Thúy Kiều là con gái cả của ông Vương, sắc đẹp tài cao, tiếng tăm đồn khắp xứ Đường.',
            },
            {
              id: '2',
              content:
                'Nàng có một tấm lòng nhân hậu và tài năng xuất chúng trong thơ ca, văn chương.',
            },
          ],
        },
      );
    }

    if (chapters.length > 0) {
      await this.chapterModel.insertMany(chapters);
      this.logger.log(`✅ Seeded ${chapters.length} chapters successfully!`);
    } else {
      this.logger.warn('⚠️ No chapters to seed.');
    }
  }
}
