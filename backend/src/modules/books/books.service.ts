import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types, UpdateQuery } from 'mongoose';

import { BooksRepository } from '../../data-access/repositories/books.repository';
import { ChaptersRepository } from '../../data-access/repositories/chapters.repository';
import { GenresRepository } from '../../data-access/repositories/genres.repository';
import { AuthorsRepository } from '@/src/data-access/repositories/authors.repository';
import { ReviewsRepository } from '@/src/data-access/repositories/reviews.repository';
import { BookListModal, BookModal } from './modals/book.modal';
import { BookDocument } from './schemas/book.schema';

import { formatPaginatedResponse } from '@/src/utils/helpers';
import { slugify } from '@/src/utils/slugify';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateBookDto } from './dto/create-book.dto';

import { ErrorMessages } from '@/src/common/constants/error-messages';


@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    private readonly booksRepository: BooksRepository,
    private readonly chaptersRepository: ChaptersRepository,
    private readonly authorsRepository: AuthorsRepository,
    private readonly reviewsRepository: ReviewsRepository,
    private readonly genresRepository: GenresRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async findAll(query: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    genres?: string;
    author?: string;
    tags?: string;
    sortBy?: string;
    order?: string;
  }) {
    const {
      page,
      limit,
      status,
      search,
      genres,
      author,
      tags,
      sortBy = 'updatedAt',
      order = 'desc',
    } = query;

    const validLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * validLimit;

    let genreIds: Types.ObjectId[] = [];
    if (genres) {
      const genreSlugs = genres.split(',').map((g) => g.trim());
      const genreDocs = await this.genresRepository.findBySlugs(genreSlugs);
      genreIds = genreDocs.map(id => new Types.ObjectId(id));

      if (genreIds.length === 0) {
        return formatPaginatedResponse([], 0, page, validLimit);
      }
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    let sort: Record<string, 1 | -1> = {};

    switch (sortBy) {
      case 'views':
        sort = { views: sortOrder, _id: 1 };
        break;
      case 'likes':
        sort = { likes: sortOrder, _id: 1 };
        break;
      case 'rating':
        sort = { computedRating: sortOrder, _id: 1 };
        break;
      case 'popular':
        sort = { reviewsCount: sortOrder, _id: 1 };
        break;
      case 'createdAt':
        sort = { createdAt: sortOrder, _id: 1 };
        break;
      case 'updatedAt':
      default:
        sort = { updatedAt: sortOrder, _id: 1 };
        break;
    }

    const { data, total } = await this.booksRepository.findWithAdvancedFilters(
      {
        status,
        search,
        genreIds,
        authorId: author ? new Types.ObjectId(author) : undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
      },
      {
        skip,
        limit: validLimit,
        sort,
        sortBy,
      }
    );

    const items = BookListModal.fromArray(data as BookDocument[]);
    return formatPaginatedResponse(items, total, page, validLimit);
  }

  async getFilters() {
    const genresAggregation = await this.genresRepository.getGenreBookCounts();

    const tagsAggregation = await this.booksRepository.getTagStats();

    return {
      genres: genresAggregation.map((g) => ({
        id: g._id.toString(),
        name: g.name,
        slug: g.slug,
        count: g.count,
      })),
      tags: tagsAggregation.map((t) => ({
        name: t.name,
        count: t.count,
      })),
    };
  }

  async findBySlug(slug: string, userId?: string) {
    this.logger.log(`Fetching book with slug: ${slug}`);

    const book = await this.booksRepository.findBySlugWithPopulate(slug);
    if (!book) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);

    const bookCallback = await this.enrichBookDetails(book);

    this.booksRepository.incrementViews(new Types.ObjectId(bookCallback._id));

    if (userId) {
      const isLiked = bookCallback.likedBy?.some(
        (id: any) => id.toString() === userId,
      );
      return { ...bookCallback, isLiked };
    }

    return bookCallback;
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const book = await this.booksRepository.findByIdWithPopulate(id);
    if (!book) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
    const bookDetails = await this.enrichBookDetails(book);

    return bookDetails;
  }

  async create(dto: CreateBookDto, coverFile?: Express.Multer.File) {
    await this.validateReferences(dto.authorId, dto.genres);

    const coverUrl = coverFile
      ? await this.cloudinaryService.uploadImage(coverFile)
      : null;

    const baseSlug = dto.slug?.trim() || slugify(dto.title);
    const uniqueSlug = await this.generateUniqueSlug(baseSlug);

    const authorIdObj = new Types.ObjectId(dto.authorId);
    const genresObj = dto.genres.map(g => new Types.ObjectId(g));

    const newBook = await this.booksRepository.create({
      ...dto,
      authorId: authorIdObj,
      genres: genresObj,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      slug: uniqueSlug,
      coverUrl: coverUrl ?? undefined,
      views: 0,
      likes: 0,
      likedBy: [],
    });

    const populatedBook = await this.booksRepository.findByIdWithPopulate(newBook._id);
    return populatedBook ? new BookModal(populatedBook as BookDocument) : null;
  }

  async update(
    id: string,
    dto: CreateBookDto,
    coverFile?: Express.Multer.File,
  ) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const book = await this.booksRepository.findById(id);
    if (!book) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);

    if (dto.authorId || dto.genres) {
      await this.validateReferences(
        dto.authorId || book.authorId.toString(),
        dto.genres || (book.genres as any),
      );
    }

    let slug = book.slug;
    if (dto.title && dto.title !== book.title) {
      const baseSlug = dto.slug?.trim() || slugify(dto.title);
      slug = await this.generateUniqueSlug(baseSlug, id);
    }

    let coverUrl = book.coverUrl;
    if (coverFile) {
      if (book.coverUrl)
        await this.cloudinaryService.deleteImage(book.coverUrl);
      coverUrl = await this.cloudinaryService.uploadImage(coverFile);
    }

    const updateData: UpdateQuery<BookDocument> = { ...dto, slug, coverUrl };
    if (dto.authorId) {
      updateData.authorId = new Types.ObjectId(dto.authorId);
    }
    if (dto.genres) {
      updateData.genres = dto.genres.map(g => new Types.ObjectId(g));
    }

    const updatedBook = await this.booksRepository.updateAndPopulate(id, updateData);



    return updatedBook ? new BookModal(updatedBook as BookDocument) : null;
  }

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const book = await this.booksRepository.findById(id);
    if (!book || book.isDeleted) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);

    await this.booksRepository.update(id, { isDeleted: true });



    return { message: 'Book deleted successfully' };
  }

  async toggleLike(slug: string, userId: string) {
    const book = await this.booksRepository.findBySlugWithPopulate(slug);
    if (!book) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);

    const uid = new Types.ObjectId(userId);
    const isLiked = book.likedBy?.some((id: any) => id.toString() === userId);

    const updatedBook = await this.booksRepository.toggleLike(book._id, uid, isLiked);



    return {
      slug: updatedBook?.slug,
      likes: updatedBook?.likes,
      isLiked: !isLiked,
    };
  }

  private async enrichBookDetails(book: any, userId?: string) {
    const bookId = book._id;

    const [{ data: chapters }, reviews, ratingStats, distribution] = await Promise.all([
      this.chaptersRepository.findMany({ filter: { bookId }, sort: { orderIndex: 1 } }),
      this.reviewsRepository.findByBookId(bookId),
      this.reviewsRepository.getAggregates(bookId),
      this.reviewsRepository.getRatingDistribution(bookId),
    ]);

    const isLiked =
      userId && book.likedBy
        ? book.likedBy.some((id) => id.toString() === userId)
        : false;

    return {
      ...book,
      isLiked,
      chapters,
      reviews,
      stats: {
        averageRating: ratingStats.averageRating,
        totalRatings: ratingStats.totalRatings,
        ratingDistribution: distribution,
      },
    };
  }

  private async validateReferences(
    authorId: string | Types.ObjectId,
    genresId: string[] | Types.ObjectId[],
  ) {
    if (authorId && !Types.ObjectId.isValid(authorId))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    if (genresId && genresId.some((id) => !Types.ObjectId.isValid(id)))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const [author, countGenres] = await Promise.all([
      this.authorsRepository.findById(authorId as string),
      this.genresRepository.countByIds(genresId.map(id => id.toString())),
    ]);

    if (!author) throw new BadRequestException(ErrorMessages.AUTHOR_NOT_FOUND);
    if (countGenres !== genresId.length)
      throw new BadRequestException(ErrorMessages.GENRE_NOT_FOUND);
  }

  private async generateUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const exists = await this.booksRepository.existsBySlug(slug, excludeId);
      if (!exists) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  async getBookStats(id: string) {
    if (!id) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const book = (await this.booksRepository.findById(id)) as any;

    if (!book) {
      throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
    }

    const chaptersCount = await this.chaptersRepository.countByBookId(
      new Types.ObjectId(id),
    );

    return {
      id,
      views: book.views || 0,
      likes: book.likes || 0,
      chapters: chaptersCount || 0,
    };
  }
}
