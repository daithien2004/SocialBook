import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import slugify from 'slugify';
import { Author, AuthorDocument } from '../authors/schemas/author.schema';
import { Book, BookDocument } from '../books/schemas/book.schema';
import { Genre, GenreDocument } from '../genres/schemas/genre.schema';
import { Chapter, ChapterDocument } from '../chapters/schemas/chapter.schema';
import { ScrapedBookData } from './dto/scraper.dto';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly baseUrl = 'https://truyenfull.vision';

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    private readonly httpService: HttpService,
  ) {}

  // ==========================================
  // PHẦN 1: LOGIC CÀO SÁCH KẾT HỢP CHƯƠNG
  // ==========================================

  /**
   * Cào danh sách sách, và tùy chọn cào luôn chapter của từng sách
   */
  async scrapeAndSaveAllBooks(
    listUrl: string,
    maxPages: number | null = null,
    scrapeChapters: boolean = false,
    chapterLimit: number = 0,
  ): Promise<{ success: number; failed: number; skipped: number }> {
    const stats = { success: 0, failed: 0, skipped: 0 };
    try {
      this.logger.log('Bắt đầu lấy danh sách URLs...');
      const bookUrls = await this.scrapeBookList(listUrl, maxPages);
      this.logger.log(`Tìm thấy ${bookUrls.length} truyện`);

      for (let i = 0; i < bookUrls.length; i++) {
        const url = bookUrls[i];
        this.logger.log(`[${i + 1}/${bookUrls.length}] Đang xử lý: ${url}`);

        try {
          // 1. Xử lý thông tin sách
          const slug = this.extractSlugFromUrl(url);
          let book: BookDocument | null = await this.bookModel.findOne({
            slug,
          });

          if (book) {
            this.logger.log(`Sách đã tồn tại: ${slug}`);
            stats.skipped++;
          } else {
            const bookData = await this.scrapeBookData(url);
            book = await this.saveBookToDatabase(bookData); // Lưu và lấy về document
            stats.success++;
            this.logger.log(`✅ Lưu sách thành công: ${bookData.title}`);
          }

          // 2. [MỚI] Nếu bật cờ scrapeChapters, cào luôn chương cho sách này
          if (scrapeChapters && book) {
            this.logger.log(`➡️ Bắt đầu cào chapters cho: ${book.title}`);
            await this.scrapeAndSaveChapters(book._id.toString(), chapterLimit);
          }

          await this.delay(1500); // Delay tránh spam
        } catch (error) {
          stats.failed++;
          this.logger.error(`❌ Lỗi khi xử lý ${url}: ${error.message}`);
        }
      }
      return stats;
    } catch (error) {
      this.logger.error(`Lỗi tổng thể: ${error.message}`);
      throw error;
    }
  }

  /**
   * [MỚI] Cào 1 cuốn sách cụ thể (bao gồm cả chapters) từ URL
   */
  async scrapeBookAndChapters(
    bookUrl: string,
    chapterLimit: number = 0,
  ): Promise<any> {
    try {
      this.logger.log(`Đang xử lý toàn bộ sách từ URL: ${bookUrl}`);

      // 1. Lưu thông tin sách
      const slug = this.extractSlugFromUrl(bookUrl);
      let book: BookDocument | null = await this.bookModel.findOne({ slug });

      if (!book) {
        const bookData = await this.scrapeBookData(bookUrl);
        book = await this.saveBookToDatabase(bookData);
        this.logger.log(`✅ Đã tạo sách mới: ${book.title}`);
      } else {
        this.logger.log(
          `ℹ️ Sách đã tồn tại: ${book.title}, tiến hành kiểm tra chương.`,
        );
      }

      // 2. Cào chapters
      const chapterStats = await this.scrapeAndSaveChapters(
        book._id.toString(),
        chapterLimit,
      );

      return {
        book: book.title,
        bookId: book._id,
        chaptersResult: chapterStats,
      };
    } catch (error) {
      this.logger.error(`Lỗi cào full sách ${bookUrl}: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // PHẦN 2: LOGIC CÀO CHAPTER
  // ==========================================

  async scrapeAndSaveChapters(
    bookId: string,
    limit: number = 0,
  ): Promise<{ success: number; failed: number }> {
    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new NotFoundException('Không tìm thấy sách với ID cung cấp');
    }

    const bookUrl = book.slug.startsWith('http')
      ? book.slug
      : `${this.baseUrl}/${book.slug}/`;

    const allChapterUrls = await this.getAllChapterUrls(bookUrl);

    // [MỚI] Xử lý logic giới hạn
    const urlsToProcess =
      limit > 0 ? allChapterUrls.slice(0, limit) : allChapterUrls;
    this.logger.log(
      `🔍 ${book.title}: Tìm thấy tổng ${allChapterUrls.length} chương. Sẽ cào: ${urlsToProcess.length} chương.`,
    );

    let success = 0;
    let failed = 0;

    // Duyệt qua danh sách đã được cắt gọn (urlsToProcess)
    for (let i = 0; i < urlsToProcess.length; i++) {
      const chapterUrl = urlsToProcess[i];
      const orderIndex = i + 1;

      try {
        // ... (Giữ nguyên logic xử lý từng chương như cũ) ...
        const chapterSlug = this.extractSlugFromUrl(chapterUrl);
        const existingChapter = await this.chapterModel.findOne({
          bookId: new Types.ObjectId(bookId),
          slug: chapterSlug,
        });

        if (existingChapter) {
          success++;
          continue;
        }

        const chapterData = await this.scrapeChapterContent(chapterUrl);
        const newChapter = new this.chapterModel({
          bookId: new Types.ObjectId(bookId),
          title: chapterData.title,
          slug: chapterSlug,
          paragraphs: chapterData.paragraphs,
          orderIndex: orderIndex,
          viewsCount: 0,
        });

        await newChapter.save();
        success++;

        if (i % 20 === 0) {
          this.logger.log(
            `...Tiến độ: ${orderIndex}/${urlsToProcess.length} chương`,
          );
        }
        await this.delay(300);
      } catch (error) {
        failed++;
        this.logger.error(`❌ Lỗi chương ${orderIndex}: ${error.message}`);
      }
    }

    this.logger.log(
      `🏁 Hoàn tất ${book.title}: ${success} thành công, ${failed} lỗi.`,
    );
    return { success, failed };
  }

  private async getAllChapterUrls(bookUrl: string): Promise<string[]> {
    const allUrls: string[] = [];
    const totalPages = await this.getTotalPages(bookUrl);

    for (let page = 1; page <= totalPages; page++) {
      let pageUrl = bookUrl;
      if (page > 1) {
        const cleanBase = bookUrl.endsWith('/') ? bookUrl : `${bookUrl}/`;
        pageUrl = `${cleanBase}trang-${page}/`;
      }

      const urls = await this.getChapterUrlsFromPage(pageUrl);
      allUrls.push(...urls);

      if (page < totalPages) await this.delay(800);
    }
    return allUrls;
  }

  private async getChapterUrlsFromPage(url: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      );
      const $ = cheerio.load(response.data);
      const urls: string[] = [];
      $('.list-chapter li a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) urls.push(href);
      });
      return urls;
    } catch (e) {
      return [];
    }
  }

  async scrapeChapterContent(
    url: string,
  ): Promise<{ title: string; paragraphs: { content: string }[] }> {
    const response = await firstValueFrom(
      this.httpService.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    );
    const $ = cheerio.load(response.data);

    let title = $('.chapter-title').text().trim();
    if (!title) title = $('h2').text().trim();

    const contentEl = $('#chapter-c');
    contentEl
      .find(
        'script, .ads-responsive, div[id^="ads"], .ads-holder, .incontent-ad',
      )
      .remove();

    let htmlContent = contentEl.html() || '';
    const splitToken = '|||SPLIT|||';
    htmlContent = htmlContent.replace(/<br\s*\/?>/gi, splitToken);

    const temp$ = cheerio.load(htmlContent);
    const textContent = temp$.text();
    const paragraphsRaw = textContent.split(splitToken);

    const paragraphs = paragraphsRaw
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((p) => ({ content: p }));

    return { title, paragraphs };
  }

  // ==========================================
  // PHẦN 3: HELPER & DATABASE
  // ==========================================

  private async saveBookToDatabase(
    bookData: ScrapedBookData,
  ): Promise<BookDocument> {
    const author = await this.findOrCreateAuthor(bookData.author);
    const genreIds = await this.findOrCreateGenres(bookData.genres);

    // Sử dụng slug từ URL để đảm bảo khớp với ID truyện gốc
    const slug = bookData.slug;
    const status = this.mapStatus(bookData.status);

    const book = new this.bookModel({
      title: bookData.title,
      slug,
      authorId: author._id,
      genres: genreIds,
      description: bookData.description,
      coverUrl: bookData.coverUrl,
      status,
      views: 0,
      likes: 0,
      tags: bookData.genres,
      isDeleted: false,
    });

    // Check lại lần nữa để chắc chắn không duplicate lúc save (concurrent)
    const existing = await this.bookModel.findOne({ slug });
    if (existing) return existing;

    return await book.save();
  }

  private async findOrCreateAuthor(
    authorName: string,
  ): Promise<AuthorDocument> {
    const trimmedName = authorName.trim();
    let author = await this.authorModel.findOne({ name: trimmedName });
    if (!author) {
      author = new this.authorModel({
        name: trimmedName,
        bio: '',
        photoUrl: '',
      });
      await author.save();
    }
    return author;
  }

  private async findOrCreateGenres(
    genreNames: string[],
  ): Promise<Types.ObjectId[]> {
    const genreIds: Types.ObjectId[] = [];
    for (const name of genreNames) {
      const trimmedName = name.trim();
      if (!trimmedName) continue;
      let genre = await this.genreModel.findOne({ name: trimmedName });
      if (!genre) {
        genre = new this.genreModel({
          name: trimmedName,
          slug: slugify(trimmedName, { lower: true, strict: true }),
          description: '',
        });
        await genre.save();
      }
      genreIds.push(genre._id as Types.ObjectId);
    }
    return genreIds;
  }

  private mapStatus(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('full') || statusLower.includes('hoàn'))
      return 'completed';
    if (statusLower.includes('đang')) return 'published';
    return 'published';
  }

  private extractSlugFromUrl(url: string): string {
    if (!url) return '';
    // Sử dụng URL object để parse chuẩn, bỏ qua query params
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const segments = path.split('/').filter((segment) => segment.length > 0);
      return segments.length > 0 ? segments[segments.length - 1] : '';
    } catch (e) {
      // Fallback regex cũ nếu url không có http
      const match = url.match(/\/([^\/]+)\/?$/);
      return match ? match[1] : '';
    }
  }

  async scrapeBookData(bookUrl: string): Promise<ScrapedBookData> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(bookUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        }),
      );
      const $ = cheerio.load(response.data);

      const title =
        $('.breadcrumb li.active h1 a[itemprop="item"] span[itemprop="name"]')
          .text()
          .trim() ||
        $('.title-book').text().trim() ||
        $('h1').first().text().trim();

      const author =
        $('.info a[itemprop="author"]').first().text().trim() ||
        $('a[itemprop="author"]').first().text().trim();

      const description = $('.desc-text').text().trim();
      const coverUrl =
        $('.book img').first().attr('src') ||
        $('img[itemprop="image"]').attr('src') ||
        '';

      const genres: string[] = [];
      $('.info a[itemprop="genre"]').each((_, el) => {
        const genre = $(el).text().trim();
        if (genre) genres.push(genre);
      });

      let status = 'published';
      if ($('.text-success').text().includes('Full')) {
        status = 'completed';
      } else if ($('.label-full').length > 0) {
        status = 'completed';
      } else {
        status = 'published';
      }

      const slug = this.extractSlugFromUrl(bookUrl);

      return {
        title,
        author,
        description,
        coverUrl,
        genres,
        status,
        sourceUrl: bookUrl,
        slug,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi cào ${bookUrl}: ${error.message}`);
      throw error;
    }
  }

  private async scrapeBookList(
    listUrl: string,
    maxPages: number | null = null,
  ): Promise<string[]> {
    const totalPages = await this.getTotalPages(listUrl);
    const pagesToScrape = maxPages
      ? Math.min(totalPages, maxPages)
      : totalPages;
    const allBookUrls: string[] = [];

    for (let page = 1; page <= pagesToScrape; page++) {
      let pageUrl = listUrl;
      if (page > 1) {
        pageUrl = listUrl.endsWith('/')
          ? `${listUrl}trang-${page}/`
          : `${listUrl}/trang-${page}/`;
      }
      const bookUrls = await this.scrapeBookListFromPage(pageUrl);
      allBookUrls.push(...bookUrls);
      if (page < pagesToScrape) await this.delay(1000);
    }
    return [...new Set(allBookUrls)];
  }

  private async getTotalPages(url: string): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      );
      const $ = cheerio.load(response.data);
      const lastPageLink = $('.pagination li a:contains("Cuối")').attr('href');

      if (lastPageLink) {
        const match = lastPageLink.match(/trang-(\d+)/);
        if (match) return parseInt(match[1]);
      }

      let maxPage = 1;
      $('.pagination li a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const match = href.match(/trang-(\d+)/);
          if (match) {
            const pageNum = parseInt(match[1]);
            if (pageNum > maxPage) maxPage = pageNum;
          }
        }
      });
      return maxPage;
    } catch (error) {
      return 1;
    }
  }

  private async scrapeBookListFromPage(pageUrl: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(pageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        }),
      );
      const $ = cheerio.load(response.data);
      const bookUrls: string[] = [];
      $('.list h3 a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          bookUrls.push(
            href.startsWith('http') ? href : `${this.baseUrl}${href}`,
          );
        }
      });
      return bookUrls;
    } catch (error) {
      return [];
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
