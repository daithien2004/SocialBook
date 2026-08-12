import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { ReadingStatus } from '@/domain/library/enums/reading-status.enum';
import { GetKnowledgeGraphQuery } from './get-knowledge-graph.query';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import slugify from 'slugify';

export interface GraphNode {
  id: string;
  label: string;
  type: 'user' | 'book' | 'genre' | 'author' | 'tag';
  val: number;
  img?: string;
  color?: string;
  isGap?: boolean;
  reason?: string;
  slug?: string;
  url?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'read' | 'belongs_to' | 'written_by' | 'has_tag' | 'semantic';
}

export interface KnowledgeGraphResult {
  nodes: GraphNode[];
  links: GraphLink[];
}

@Injectable()
export class GetKnowledgeGraphUseCase {
  private readonly logger = new Logger(GetKnowledgeGraphUseCase.name);

  constructor(
    private readonly readingListRepository: IReadingListRepository,
    private readonly bookRepository: IBookRepository,
    private readonly userRepository: IUserRepository,
    private readonly genreRepository: IGenreRepository,
    private readonly geminiService: IGeminiService,
  ) {}

  async execute(query: GetKnowledgeGraphQuery): Promise<KnowledgeGraphResult> {
    const userId = UserId.create(query.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Fetch completed / reading reading list
    const completedItems =
      await this.readingListRepository.findAllDetailByUserId(userId, [
        ReadingStatus.COMPLETED,
        ReadingStatus.READING,
      ]);

    if (completedItems.length === 0) {
      return {
        nodes: [
          {
            id: user.id.getValue(),
            label: user.username,
            img: user.image,
            type: 'user',
            val: 20,
          },
        ],
        links: [],
      };
    }

    // 2. Fetch full book details
    const bookIds = completedItems.map((item) => BookId.create(item.bookId.id));
    const books = await this.bookRepository.findByIds(bookIds);

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Central User Node
    nodes.push({
      id: user.id.getValue(),
      label: user.username,
      img: user.image,
      type: 'user',
      val: 25,
      color: '#3b82f6', // blue-500
    });

    const processedAuthors = new Set<string>();
    const processedGenres = new Set<string>();
    const processedTags = new Set<string>();

    const userGenres: string[] = [];

    const bookStatusMap = new Map<string, ReadingStatus>();
    completedItems.forEach((item) => {
      bookStatusMap.set(item.bookId.id, item.status);
    });

    books.forEach((book) => {
      // Book Node
      nodes.push({
        id: `book_${book.id.getValue()}`,
        label: book.title.getValue(),
        type: 'book',
        val:
          bookStatusMap.get(book.id.getValue()) === ReadingStatus.COMPLETED
            ? 20
            : 12,
        img: book.coverUrl,
        color: '#10b981', // emerald-500
        slug: book.slug,
      });

      // Link User -> Book
      links.push({
        source: user.id.getValue(),
        target: `book_${book.id.getValue()}`,
        type: 'read',
      });

      // Author Node & Link
      const authorId = book.authorId.getValue();
      const authorName = book.authorName || 'Unknown Author';
      if (!processedAuthors.has(authorId)) {
        nodes.push({
          id: `author_${authorId}`,
          label: authorName,
          type: 'author',
          val: 12,
          color: '#f59e0b', // amber-500
        });
        processedAuthors.add(authorId);
      }
      links.push({
        source: `book_${book.id.getValue()}`,
        target: `author_${authorId}`,
        type: 'written_by',
      });

      // Genre Nodes & Links
      book.genreObjects?.forEach((genre) => {
        userGenres.push(genre.name);
        if (!processedGenres.has(genre.id)) {
          nodes.push({
            id: `genre_${genre.id}`,
            label: genre.name,
            type: 'genre',
            val: 10,
            color: '#8b5cf6', // violet-500
          });
          processedGenres.add(genre.id);
        }
        links.push({
          source: `book_${book.id.getValue()}`,
          target: `genre_${genre.id}`,
          type: 'belongs_to',
        });
      });

      // Tag Nodes & Links
      book.tags.forEach((tag) => {
        const tagId = `tag_${tag.toLowerCase().replace(/\s+/g, '_')}`;
        if (!processedTags.has(tagId)) {
          nodes.push({
            id: tagId,
            label: tag,
            type: 'tag',
            val: 8,
            color: '#64748b', // slate-500
          });
          processedTags.add(tagId);
        }
        links.push({
          source: `book_${book.id.getValue()}`,
          target: tagId,
          type: 'has_tag',
        });
      });
    });

    // 3. AI Knowledge Gap Analysis
    try {
      const allGenres = await this.genreRepository.findAllSimple();
      const availableGenres = allGenres.map((g) => g.name.getValue());
      const uniqueUserGenres = Array.from(new Set(userGenres));

      this.logger.log(
        `[KnowledgeGraph] User read genres: ${uniqueUserGenres.join(', ')}`,
      );
      this.logger.log(
        `[KnowledgeGraph] Available genres: ${availableGenres.length}`,
      );

      const prompt = `Bạn là một thủ thư và chuyên gia quản lý tri thức.
            Người dùng đã đọc sách thuộc các thể loại: [${uniqueUserGenres.join(', ')}].
            Thư viện của chúng tôi có các thể loại: [${availableGenres.join(', ')}].
            
            Dựa trên hồ sơ hiện tại, hãy xác định 3 thể loại KHÁC BIỆT mà họ chưa khám phá nhưng nên thử.
            Với mỗi khoảng trống, giải thích tại sao thể loại này giúp "cân bằng tư duy" cho việc đọc hiện tại của họ.
            Đề xuất 1 tên sách nổi tiếng cụ thể cho mỗi khoảng trống.
            
            YÊU CẦU QUAN TRỌNG:
            - Tất cả các trường PHẢI bằng tiếng Việt.
            - suggestedBook: tên sách bằng tiếng Việt (nếu đã dịch) hoặc nguyên gốc.
            
            CHỈ trả về JSON hợp lệ theo định dạng:
            {
              "gaps": [
                {
                  "genre": "Tên thể loại",
                  "reason": "Giải thích chi tiết bằng tiếng Việt",
                  "suggestedBook": "Tên sách nổi tiếng tương ứng"
                }
              ]
            }`;

      let aiResult:
        | {
            gaps: Array<{
              genre: string;
              reason: string;
              suggestedBook: string;
              url?: string;
              slug?: string;
              img?: string;
            }>;
          }
        | undefined;
      try {
        aiResult = await this.geminiService.generateJSON<{
          gaps: Array<{
            genre: string;
            reason: string;
            suggestedBook: string;
          }>;
        }>(prompt);
        this.logger.log(
          `[KnowledgeGraph] AI generated ${aiResult?.gaps?.length || 0} gaps`,
        );
      } catch (aiErr: unknown) {
        const aiError = aiErr as Error;
        this.logger.error(
          '[KnowledgeGraph] AI Analysis failed, using fallback.',
          aiError.message,
        );
        // Fallback: Pick 2 genres the user hasn't read
        const missingGenreObjs = allGenres
          .filter((g) => !uniqueUserGenres.includes(g.name.getValue()))
          .slice(0, 2);

        const fallbackGaps = await Promise.all(
          missingGenreObjs.map(async (g) => {
            let suggestedBookTitle = 'Tác phẩm tiêu biểu';
            let slug: string | undefined = undefined;
            let img: string | undefined = undefined;

            try {
              const booksInGenre = await this.bookRepository.findByGenre(
                g.id,
                { page: 1, limit: 1 },
                { sortBy: 'views', order: 'desc' },
              );
              if (booksInGenre.data.length > 0) {
                const book = booksInGenre.data[0];
                suggestedBookTitle = book.title.getValue();
                slug = book.slug;
                img = book.coverUrl;
              }
            } catch {
              // ignore
            }

            return {
              genre: g.name.getValue(),
              reason:
                'Chúng tôi nhận thấy bạn chưa khám phá mảng này. Hãy thử để mở rộng góc nhìn nhé!',
              suggestedBook: suggestedBookTitle,
              slug,
              img,
            };
          }),
        );

        aiResult = { gaps: fallbackGaps };
      }

      if (aiResult && aiResult.gaps) {
        for (let index = 0; index < aiResult.gaps.length; index++) {
          const gap = aiResult.gaps[index];
          const gapId = `gap_genre_${index}`;
          const bookGapId = `gap_book_${index}`;

          // Add Gap Genre Node
          nodes.push({
            id: gapId,
            label: gap.genre,
            type: 'genre',
            val: 12,
            color: '#ec4899', // pink-500
            isGap: true,
            reason: gap.reason,
          });

          const bookSlug =
            gap.slug ||
            slugify(gap.suggestedBook, {
              lower: true,
              strict: true,
              locale: 'vi',
            });

          const url = `https://www.google.com/search?q=${encodeURIComponent(gap.suggestedBook)}`;

          // Add Gap Book Node
          nodes.push({
            id: bookGapId,
            label: gap.suggestedBook,
            type: 'book',
            val: 10,
            color: '#f472b6', // pink-400
            isGap: true,
            reason: `Gợi ý để lấp đầy khoảng trống ${gap.genre} của bạn.`,
            slug: bookSlug,
            img: gap.img,
            url,
          });

          // Links
          links.push({
            source: user.id.getValue(),
            target: gapId,
            type: 'semantic',
          });
          links.push({
            source: gapId,
            target: bookGapId,
            type: 'belongs_to',
          });
        }
      }
    } catch (error: unknown) {
      this.logger.error('[KnowledgeGraph] Global analysis error:', error);
    }

    return { nodes, links };
  }
}
