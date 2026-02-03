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
import { ErrorMessages } from '@/src/common/constants/error-messages';

interface BookInfo {
  title: string;
  author: string;
  genre: string;
  imageUrl: string;
  description: string;
  chapters: ChapterInfo[];
}

interface ChapterInfo {
  title: string;
  url: string;
  order: number;
}

export interface CrawlResult {
  success: number;
  failed: number;
  books: {
    id: string;
    title: string;
    slug: string;
    chaptersCount: number;
  }[];
  errors: string[];
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly baseUrl = 'https://truyenfull.vision';
  private readonly nhasachmienphi = 'https://nhasachmienphi.com';

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    private readonly httpService: HttpService,
  ) { }

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
          const slug = this.extractSlugFromUrl(url);
          let book: BookDocument | null = await this.bookModel.findOne({
            slug,
          });

          if (book) {
            this.logger.log(`Sách đã tồn tại: ${slug}`);
            stats.skipped++;
          } else {
            const bookData = await this.scrapeBookData(url);
            book = await this.saveBookToDatabase(bookData);
            stats.success++;
            this.logger.log(`✅ Lưu sách thành công: ${bookData.title}`);
          }

          if (scrapeChapters && book) {
            this.logger.log(`➡️ Bắt đầu cào chapters cho: ${book.title}`);
            await this.scrapeAndSaveChapters(book._id.toString(), chapterLimit);
          }

          await this.delay(1500);
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

  async scrapeBookAndChapters(
    bookUrl: string,
    chapterLimit: number = 0,
  ): Promise<{ book: string; bookId: Types.ObjectId; chaptersResult: { success: number; failed: number } }> {
    try {
      this.logger.log(`Đang xử lý toàn bộ sách từ URL: ${bookUrl}`);

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

  async scrapeAndSaveChapters(
    bookId: string,
    limit: number = 0,
  ): Promise<{ success: number; failed: number }> {
    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
    }

    const bookUrl = book.slug.startsWith('http')
      ? book.slug
      : `${this.baseUrl}/${book.slug}/`;

    const allChapterUrls = await this.getAllChapterUrls(bookUrl);

    const urlsToProcess =
      limit > 0 ? allChapterUrls.slice(0, limit) : allChapterUrls;
    this.logger.log(
      `🔍 ${book.title}: Tìm thấy tổng ${allChapterUrls.length} chương. Sẽ cào: ${urlsToProcess.length} chương.`,
    );

    let success = 0;
    let failed = 0;

    for (let i = 0; i < urlsToProcess.length; i++) {
      const chapterUrl = urlsToProcess[i];
      const orderIndex = i + 1;

      try {
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
    const textContent = temp$('*').text();
    const paragraphsRaw = textContent.split(splitToken);

    const paragraphs = paragraphsRaw
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((p) => ({ content: p }));

    return { title, paragraphs };
  }

  private async saveBookToDatabase(
    bookData: ScrapedBookData,
  ): Promise<BookDocument> {
    const author = await this.findOrCreateAuthor(bookData.author);
    const genreIds = await this.findOrCreateGenres(bookData.genres);

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
          slug: slugify(trimmedName, {
            lower: true,
            strict: true,
            locale: 'vi',
            remove: /[*+~.()'"!:@]/g,
          }),
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
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const segments = path.split('/').filter((segment) => segment.length > 0);
      return segments.length > 0 ? segments[segments.length - 1] : '';
    } catch (e) {
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

  /**
   * Crawl danh sách sách từ category nhasachmienphi.com
   */
  async crawlNSMPCategoryBooks(
    categoryUrl: string,
    limit: number = 20,
  ): Promise<string[]> {
    try {
      this.logger.log(`[NSMP] Crawling category: ${categoryUrl}`);
      const response = await firstValueFrom(
        this.httpService.get(categoryUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000,
        }),
      );

      const $ = cheerio.load(response.data);
      const bookUrls: string[] = [];

      $('.item_sach a').each((index, element) => {
        if (index < limit) {
          const url = $(element).attr('href');
          if (url && url.includes('.html')) {
            bookUrls.push(url);
          }
        }
      });

      this.logger.log(`[NSMP] Found ${bookUrls.length} books in category`);
      return bookUrls;
    } catch (error) {
      this.logger.error(`[NSMP] Error crawling category: ${error.message}`);
      throw error;
    }
  }

  /**
 * Crawl chi tiết một cuốn sách từ nhasachmienphi.com
 */
  async crawlNSMPBookDetails(bookUrl: string): Promise<BookInfo> {
    try {
      this.logger.log(`[NSMP] Crawling book: ${bookUrl}`);
      const response = await firstValueFrom(
        this.httpService.get(bookUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000,
        }),
      );

      const $ = cheerio.load(response.data);

      const title = $('h1.tblue.fs-20, h1.tblue').first().text().trim();

      const authorText = $('div.mg-t-10:contains("Tác giả:")').text();
      const author = authorText
        ? authorText.replace('Tác giả:', '').trim()
        : 'Unknown';

      const genre =
        $('div.mg-tb-10 a.tblue').first().text().trim() || 'Uncategorized';

      let imageUrl = $('img[src*="thumbnail"]').first().attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = this.nhasachmienphi + imageUrl;
      }

      // ✅ IMPROVED: Clean description với nhiều selectors
      const description = this.cleanNSMPDescription($);

      const chapters: ChapterInfo[] = [];
      $('.item_ch a, .box_chhr a').each((index, element) => {
        const chapterTitle = $(element).text().trim();
        const chapterUrl = $(element).attr('href');

        if (chapterUrl && chapterTitle) {
          chapters.push({
            title: chapterTitle,
            url: chapterUrl,
            order: index + 1,
          });
        }
      });

      return {
        title,
        author,
        genre,
        imageUrl,
        description,
        chapters,
      };
    } catch (error) {
      this.logger.error(
        `[NSMP] Error crawling book details from ${bookUrl}: ${error.message}`,
      );
      throw error;
    }
  }



  /**
 * ✅ IMPROVED: Helper để clean description từ nhasachmienphi
 */
  private cleanNSMPDescription($: ReturnType<typeof cheerio.load>): string {
    const descriptionParagraphs: string[] = [];

    // Thử nhiều selectors khác nhau
    const selectors = [
      '.gioi_thieu_sach',
      '.content_p_al .gioi_thieu_sach',
      '.content_p .gioi_thieu_sach',
      'div.gioi_thieu_sach'
    ];

    let contentElement: any | null = null; // Casting to any to avoid complex Cheerio type mismatches

    // Tìm selector phù hợp
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        contentElement = element;
        break;
      }
    }

    if (!contentElement || contentElement.length === 0) {
      // Fallback về meta description
      return $('meta[name="description"]').attr('content') || 'No description';
    }

    // Lấy tất cả paragraphs
    contentElement.find('p').each((_, element) => {
      let text = $(element).text().trim();

      // Clean HTML entities
      text = text
        .replace(/&#8211;/g, '–')
        .replace(/&hellip;/g, '...')
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8230;/g, '...')
        .trim();

      // Skip ads paragraphs and empty ones
      if (
        text &&
        !text.includes('Xem thêm') &&
        !text.includes('INLINE RELATED') &&
        text.length > 10
      ) {
        descriptionParagraphs.push(text);
      }
    });

    let description = descriptionParagraphs.join('\n\n');

    // Nếu vẫn không có gì, thử lấy text trực tiếp
    if (!description || description.length < 50) {
      const directText = contentElement
        .clone()
        .find('a, script, style')
        .remove()
        .end()
        .text()
        .trim();

      if (directText && directText.length > 50) {
        // Split by multiple newlines và clean
        description = directText
          .split(/\n\n+/)
          .map(p => p.trim())
          .filter(p =>
            p.length > 10 &&
            !p.includes('Xem thêm') &&
            !p.includes('INLINE RELATED')
          )
          .join('\n\n');
      }
    }

    // Clean up excessive whitespace
    description = description.replace(/\n{3,}/g, '\n\n').trim();

    // Giới hạn độ dài nếu quá dài (optional)
    if (description.length > 2000) {
      description = description.substring(0, 2000).trim() + '...';
    }

    return description || 'No description available';
  }

  /**
 * Crawl nội dung một chapter từ nhasachmienphi
 */
  async crawlNSMPChapterContent(chapterUrl: string): Promise<{
    title: string;
    paragraphs: { content: string }[];
  }> {
    try {
      this.logger.log(`[NSMP] Crawling chapter: ${chapterUrl}`);
      const response = await firstValueFrom(
        this.httpService.get(chapterUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000,
        }),
      );

      const $ = cheerio.load(response.data);

      // ✅ Get chapter title
      let title = $('h2.mg-t-10').text().trim();

      if (!title) {
        title = $('h2').first().text().trim();
      }

      if (!title) {
        title = 'Untitled Chapter';
      }

      // ✅ Get paragraphs from chapter content
      const paragraphs: { content: string }[] = [];

      // Try multiple selectors
      const contentSelectors = [
        '.noi_dung_online p',
        '.content_p p',
        '.content_p_al p',
      ];

      let foundContent = false;

      for (const selector of contentSelectors) {
        const elements = $(selector);

        if (elements.length > 0) {
          elements.each((_, element) => {
            let text = $(element).text().trim();

            // Clean HTML entities
            text = text
              .replace(/&#8211;/g, '–')
              .replace(/&hellip;/g, '...')
              .replace(/&#8220;/g, '"')
              .replace(/&#8221;/g, '"')
              .replace(/&nbsp;/g, ' ')
              .replace(/&#8230;/g, '...')
              .trim();

            // Only add non-empty paragraphs
            if (text && text.length > 5) {
              paragraphs.push({ content: text });
              foundContent = true;
            }
          });

          if (foundContent) break; // Stop after finding content
        }
      }

      // ✅ Fallback: if no paragraphs found, create one with error message
      if (paragraphs.length === 0) {
        paragraphs.push({
          content: 'No content available for this chapter.'
        });
      }

      return {
        title,
        paragraphs,
      };
    } catch (error) {
      this.logger.error(
        `[NSMP] Error crawling chapter content: ${error.message}`,
      );

      // Return error as paragraph
      return {
        title: 'Error',
        paragraphs: [{ content: 'Content unavailable due to error.' }],
      };
    }
  }

  /**
 * Import một cuốn sách từ nhasachmienphi vào database
 */
  async importNSMPBookToDatabase(bookUrl: string): Promise<BookDocument> {
    try {
      const bookInfo = await this.crawlNSMPBookDetails(bookUrl);

      // Check if book exists
      const slug = this.generateSlug(bookInfo.title);
      const existingBook = await this.bookModel.findOne({ slug });

      if (existingBook) {
        this.logger.warn(`[NSMP] Book already exists: ${bookInfo.title}`);

        // ✅ Still import missing chapters if book exists
        const existingChapters = await this.chapterModel.countDocuments({
          bookId: existingBook._id,
        });

        this.logger.log(
          `[NSMP] Existing book has ${existingChapters}/${bookInfo.chapters.length} chapters`,
        );

        if (existingChapters < bookInfo.chapters.length) {
          this.logger.log('[NSMP] Importing missing chapters...');

          let successChapters = 0;
          for (const [index, chapterInfo] of bookInfo.chapters.entries()) {
            try {
              await this.importNSMPChapter(existingBook._id, chapterInfo);
              successChapters++;

              if (index < bookInfo.chapters.length - 1) {
                await this.delay(500);
              }
            } catch (error) {
              this.logger.error(
                `[NSMP] Failed to import chapter ${chapterInfo.title}: ${error.message}`,
              );
            }
          }

          this.logger.log(
            `[NSMP] Import completed: ${successChapters}/${bookInfo.chapters.length} chapters`,
          );
        }

        return existingBook;
      }

      // Find or create genre
      let genre = await this.genreModel.findOne({ name: bookInfo.genre });
      if (!genre) {
        genre = await this.genreModel.create({
          name: bookInfo.genre,
          description: `Thể loại ${bookInfo.genre}`,
          slug: this.generateSlug(bookInfo.genre),
        });
        this.logger.log(`[NSMP] Created new genre: ${genre.name}`);
      }

      // Find or create author
      let author = await this.authorModel.findOne({ name: bookInfo.author });
      if (!author) {
        author = await this.authorModel.create({
          name: bookInfo.author,
          bio: `Tác giả ${bookInfo.author}`,
        });
        this.logger.log(`[NSMP] Created new author: ${author.name}`);
      }

      // Create book
      const book = await this.bookModel.create({
        title: bookInfo.title,
        description: bookInfo.description,
        coverUrl: bookInfo.imageUrl,
        authorId: author._id,
        genres: [genre._id],
        status: 'published',
        slug: slug,
        views: 0,
        likes: 0,
      });

      this.logger.log(
        `[NSMP] ✓ Created book: ${book.title} - Starting to import ${bookInfo.chapters.length} chapters...`,
      );

      // Import chapters with progress tracking
      let successChapters = 0;
      let failedChapters = 0;

      for (const [index, chapterInfo] of bookInfo.chapters.entries()) {
        try {
          await this.importNSMPChapter(book._id, chapterInfo);
          successChapters++;

          // Log progress every 5 chapters
          if ((index + 1) % 5 === 0 || index === bookInfo.chapters.length - 1) {
            this.logger.log(
              `[NSMP] Progress: ${index + 1}/${bookInfo.chapters.length} chapters processed`,
            );
          }

          if (index < bookInfo.chapters.length - 1) {
            await this.delay(500);
          }
        } catch (error) {
          failedChapters++;
          this.logger.error(
            `[NSMP] Failed to import chapter ${chapterInfo.title}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `[NSMP] ✅ Import completed for "${book.title}": ${successChapters} success, ${failedChapters} failed`,
      );

      return book;
    } catch (error) {
      this.logger.error(
        `[NSMP] Error importing book from ${bookUrl}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
  * Import một chapter từ nhasachmienphi
  */
  private async importNSMPChapter(
    bookId: Types.ObjectId,
    chapterInfo: ChapterInfo,
  ): Promise<ChapterDocument> {
    try {
      const chapterData = await this.crawlNSMPChapterContent(chapterInfo.url);
      const chapterSlug = this.generateSlug(chapterInfo.title);

      // ✅ Check if chapter already exists
      const existingChapter = await this.chapterModel.findOne({
        bookId,
        slug: chapterSlug,
      });

      if (existingChapter) {
        this.logger.log(`[NSMP] Chapter already exists: ${chapterInfo.title}`);
        return existingChapter;
      }

      // ✅ Create chapter with paragraphs
      const chapter = await this.chapterModel.create({
        bookId,
        title: chapterData.title,
        slug: chapterSlug,
        paragraphs: chapterData.paragraphs, // ✅ Array of {content: string}
        orderIndex: chapterInfo.order,
        viewsCount: 0,
      });

      this.logger.log(`[NSMP] ✓ Created chapter: ${chapter.title} (${chapterData.paragraphs.length} paragraphs)`);

      return chapter;
    } catch (error) {
      this.logger.error(
        `[NSMP] Error importing chapter ${chapterInfo.title}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Crawl và import toàn bộ category từ nhasachmienphi
   */
  async crawlAndImportNSMPCategory(
    categoryUrl: string,
    limit: number = 10,
  ): Promise<CrawlResult> {
    const result: CrawlResult = {
      success: 0,
      failed: 0,
      books: [],
      errors: [],
    };

    try {
      const bookUrls = await this.crawlNSMPCategoryBooks(categoryUrl, limit);
      this.logger.log(`[NSMP] Found ${bookUrls.length} books to import`);

      for (const [index, bookUrl] of bookUrls.entries()) {
        try {
          this.logger.log(
            `[NSMP] Processing book ${index + 1}/${bookUrls.length}: ${bookUrl}`,
          );

          const book = await this.importNSMPBookToDatabase(bookUrl);

          const chaptersCount = await this.chapterModel.countDocuments({
            bookId: book._id,
          });

          result.books.push({
            id: book._id.toString(),
            title: book.title,
            slug: book.slug,
            chaptersCount,
          });

          result.success++;
          this.logger.log(`[NSMP] ✓ Successfully imported: ${book.title}`);

          if (index < bookUrls.length - 1) {
            await this.delay(2000);
          }
        } catch (error) {
          result.failed++;
          const errorMsg = `Failed to import book from ${bookUrl}: ${error.message}`;
          result.errors.push(errorMsg);
          this.logger.error(`[NSMP] ✗ ${errorMsg}`);
        }
      }

      this.logger.log(
        `[NSMP] Import completed: ${result.success} success, ${result.failed} failed`,
      );
    } catch (error) {
      this.logger.error(
        `[NSMP] Error in crawlAndImportNSMPCategory: ${error.message}`,
      );
      result.errors.push(`Category crawl failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Import một cuốn sách đơn lẻ từ nhasachmienphi
   */
  async importNSMPSingleBook(bookUrl: string): Promise<{
    success: boolean;
    book?: {
      id: string;
      title: string;
      slug: string;
      chaptersCount: number;
    };
    error?: string;
  }> {
    try {
      const book = await this.importNSMPBookToDatabase(bookUrl);

      const chaptersCount = await this.chapterModel.countDocuments({
        bookId: book._id,
      });

      return {
        success: true,
        book: {
          id: book._id.toString(),
          title: book.title,
          slug: book.slug,
          chaptersCount,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate slug từ string
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
