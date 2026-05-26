import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { ReadingStatus } from '@/domain/library/enums/reading-status.enum';
import { GetKnowledgeGraphQuery } from './get-knowledge-graph.query';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';

export interface GraphNode {
  id: string;
  label: string;
  type: 'user' | 'book' | 'genre' | 'author' | 'tag';
  val: number;
  img?: string;
  color?: string;
  isGap?: boolean;
  reason?: string;
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
    @Inject(GEMINI_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
  ) {}

  async execute(query: GetKnowledgeGraphQuery): Promise<KnowledgeGraphResult> {
    const userId = UserId.create(query.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Fetch completed reading list
    const completedItems =
      await this.readingListRepository.findAllDetailByUserId(
        userId,
        ReadingStatus.COMPLETED,
      );

    if (completedItems.length === 0) {
      return {
        nodes: [
          {
            id: user.id.getValue(),
            label: user.username,
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
      type: 'user',
      val: 25,
      color: '#3b82f6', // blue-500
    });

    const processedAuthors = new Set<string>();
    const processedGenres = new Set<string>();
    const processedTags = new Set<string>();

    const userGenres: string[] = [];

    books.forEach((book) => {
      // Book Node
      nodes.push({
        id: `book_${book.id.getValue()}`,
        label: book.title.getValue(),
        type: 'book',
        val: 15,
        img: book.coverUrl,
        color: '#10b981', // emerald-500
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

      const prompt = `You are a professional librarian and knowledge curator. 
            The user has read books in these genres: [${uniqueUserGenres.join(', ')}]. 
            Our entire library contains these genres: [${availableGenres.join(', ')}].
            
            Based on their current profile, identify 3 DISTINCT genres they haven't explored yet but should. 
            For each gap, explain why it provides a "mental balance" to their current reading (e.g., if they read Tech, suggest Philosophy for ethics).
            Also suggest 1 specific famous book title for each gap.
            
            CRITICAL: Respond ONLY with a valid JSON object in this format:
            {
              "gaps": [
                {
                  "genre": "Genre Name",
                  "reason": "Why this balances their current knowledge",
                  "suggestedBook": "Book Title"
                }
              ]
            }`;

      let aiResult:
        | {
            gaps: Array<{
              genre: string;
              reason: string;
              suggestedBook: string;
            }>;
          }
        | undefined;
      try {
        aiResult = await this.geminiService.generateJSON<{
          gaps: Array<{ genre: string; reason: string; suggestedBook: string }>;
        }>(prompt);
        this.logger.log(
          `[KnowledgeGraph] AI generated ${aiResult?.gaps?.length || 0} gaps`,
        );
      } catch (aiErr) {
        this.logger.error(
          '[KnowledgeGraph] AI Analysis failed, using fallback.',
          aiErr.message,
        );
        // Fallback: Pick 2 genres the user hasn't read
        const missingGenres = availableGenres
          .filter((g) => !uniqueUserGenres.includes(g))
          .slice(0, 2);
        aiResult = {
          gaps: missingGenres.map((g) => ({
            genre: g,
            reason:
              'Chúng tôi nhận thấy bạn chưa khám phá mảng này. Hãy thử để mở rộng góc nhìn nhé!',
            suggestedBook: 'Tác phẩm tiêu biểu',
          })),
        };
      }

      if (aiResult && aiResult.gaps) {
        aiResult.gaps.forEach((gap, index) => {
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

          // Add Gap Book Node
          nodes.push({
            id: bookGapId,
            label: gap.suggestedBook,
            type: 'book',
            val: 10,
            color: '#f472b6', // pink-400
            isGap: true,
            reason: `Gợi ý để lấp đầy khoảng trống ${gap.genre} của bạn.`,
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
        });
      }
    } catch (error) {
      this.logger.error('[KnowledgeGraph] Global analysis error:', error);
    }

    return { nodes, links };
  }
}
