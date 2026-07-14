import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';

interface BookFactoryOverrides {
  id?: string;
  title?: string;
  slug?: string;
  authorId?: string;
  genres?: string[];
  description?: string;
  publishedYear?: string;
  coverUrl?: string;
  status?: 'draft' | 'published' | 'completed';
  tags?: string[];
  views?: number;
  likes?: number;
  likedBy?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  authorName?: string;
  chapterCount?: number;
}

export function createBookEntity(overrides: BookFactoryOverrides = {}): Book {
  const {
    id = 'book-1',
    title = 'Đắc Nhân Tâm',
    slug = 'dac-nhan-tam',
    authorId = 'author-1',
    genres = ['genre-1'],
    description = 'Cuốn sách nổi tiếng về nghệ thuật giao tiếp',
    publishedYear = '1936',
    coverUrl = 'https://example.com/cover.jpg',
    status = 'published',
    tags = ['self-help', 'communication'],
    views = 100,
    likes = 20,
    likedBy = ['user-1', 'user-2'],
    createdAt = new Date('2025-01-01'),
    updatedAt = new Date('2025-01-15'),
    authorName,
    chapterCount,
  } = overrides;

  return Book.reconstitute({
    id,
    title,
    slug,
    authorId,
    genres,
    description,
    publishedYear,
    coverUrl,
    status,
    tags,
    views,
    likes,
    likedBy,
    createdAt,
    updatedAt,
    ...(authorName && { authorName }),
    ...(chapterCount !== undefined && { chapterCount }),
  });
}

export function createBookId(value: string = 'book-1'): BookId {
  return BookId.create(value);
}
