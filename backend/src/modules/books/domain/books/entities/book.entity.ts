import slugify from 'slugify';
import { AuthorId } from '../value-objects/author-id.vo';
import { BookId } from '../value-objects/book-id.vo';
import { BookStatus } from '../value-objects/book-status.vo';
import { BookTitle } from '../value-objects/book-title.vo';
import { GenreId } from '../value-objects/genre-id.vo';
import { Entity } from '@/shared/domain/entity.base';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

export interface BookProps {
  title: BookTitle;
  slug: string;
  authorId: AuthorId;
  genres: GenreId[];
  description: string;
  publishedYear: string;
  coverUrl: string;
  status: BookStatus;
  tags: string[];
  views: number;
  likes: number;
  likedBy: string[];
  genreObjects?: { id: string; name: string; slug: string }[];
  authorName?: string;
  author?: { id: string; name: string };
  chapterCount?: number;
  vectorIndexedAt?: Date | null;
}

export class Book extends Entity<BookId> {
  private _props: BookProps;
  private _loadedVersion: number;
  private _isNew: boolean;
  private _dirty: boolean;

  private constructor(
    id: BookId,
    props: BookProps,
    createdAt?: Date,
    updatedAt?: Date,
    isNew = true,
    loadedVersion = 0,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
    this._isNew = isNew;
    this._loadedVersion = loadedVersion;
    this._dirty = isNew;
  }

  static create(props: {
    id: BookId;
    title: string;
    authorId: string;
    genres: string[];
    description?: string;
    publishedYear?: string;
    coverUrl?: string;
    status?: 'draft' | 'published' | 'completed';
    tags?: string[];
  }): Book {
    const title = BookTitle.create(props.title);
    const slug = Book.generateSlug(props.title);
    const authorId = AuthorId.create(props.authorId);
    const genres = props.genres.map((id) => GenreId.create(id));
    const status = props.status
      ? BookStatus.create(props.status)
      : BookStatus.draft();

    return new Book(props.id, {
      title,
      slug,
      authorId,
      genres,
      description: props.description?.trim() || '',
      publishedYear: props.publishedYear?.trim() || '',
      coverUrl: props.coverUrl?.trim() || '',
      status,
      tags: props.tags || [],
      views: 0,
      likes: 0,
      likedBy: [],
      genreObjects: undefined,
      authorName: undefined,
      author: undefined,
      chapterCount: 0,
      vectorIndexedAt: null,
    });
  }

  static reconstitute(props: {
    id: string;
    title: string;
    slug: string;
    authorId: string;
    genres: string[];
    description: string;
    publishedYear: string;
    coverUrl: string;
    status: 'draft' | 'published' | 'completed';
    tags: string[];
    views: number;
    likes: number;
    likedBy: string[];
    createdAt: Date;
    updatedAt: Date;
    genreObjects?: { id: string; name: string; slug: string }[];
    authorName?: string;
    author?: { id: string; name: string };
    chapterCount?: number;
    vectorIndexedAt?: Date | null;
    version?: number;
  }): Book {
    const loadedVersion = props.version ?? 0;
    return new Book(
      BookId.create(props.id),
      {
        title: BookTitle.create(props.title),
        slug: props.slug,
        authorId: AuthorId.create(props.authorId),
        genres: props.genres.map((id) => GenreId.create(id)),
        description: props.description,
        publishedYear: props.publishedYear,
        coverUrl: props.coverUrl,
        status: BookStatus.create(props.status),
        tags: props.tags,
        views: props.views,
        likes: props.likes,
        likedBy: props.likedBy,
        genreObjects: props.genreObjects,
        authorName: props.authorName,
        author: props.author,
        chapterCount: props.chapterCount,
        vectorIndexedAt: props.vectorIndexedAt ?? null,
      },
      props.createdAt,
      props.updatedAt,
      false,
      loadedVersion,
    );
  }

  get loadedVersion(): number {
    return this._loadedVersion;
  }

  get isNew(): boolean {
    return this._isNew;
  }

  get isDirty(): boolean {
    return this._dirty;
  }

  markPersisted(version: number): void {
    this._loadedVersion = version;
    this._isNew = false;
    this._dirty = false;
  }

  protected override markAsUpdated(): void {
    super.markAsUpdated();
    this._dirty = true;
  }

  // Getters
  get title(): BookTitle {
    return this._props.title;
  }
  get slug(): string {
    return this._props.slug;
  }
  get authorId(): AuthorId {
    return this._props.authorId;
  }
  get genres(): GenreId[] {
    return [...this._props.genres];
  }
  get description(): string {
    return this._props.description;
  }
  get publishedYear(): string {
    return this._props.publishedYear;
  }
  get coverUrl(): string {
    return this._props.coverUrl;
  }
  get status(): BookStatus {
    return this._props.status;
  }
  get tags(): string[] {
    return [...this._props.tags];
  }
  get views(): number {
    return this._props.views;
  }
  get likes(): number {
    return this._props.likes;
  }
  get likedBy(): string[] {
    return [...this._props.likedBy];
  }
  get authorName(): string | undefined {
    return this._props.authorName;
  }
  get chapterCount(): number | undefined {
    return this._props.chapterCount;
  }
  get genreObjects(): { id: string; name: string; slug: string }[] | undefined {
    return this._props.genreObjects;
  }
  get author(): { id: string; name: string } | undefined {
    return this._props.author;
  }
  get vectorIndexedAt(): Date | null {
    return this._props.vectorIndexedAt ?? null;
  }

  // Business methods
  changeTitle(newTitle: string): void {
    const title = BookTitle.create(newTitle);
    this._props.title = title;
    this._props.slug = Book.generateSlug(newTitle);
    this.markAsUpdated();
  }

  changeAuthor(newAuthorId: string): void {
    this._props.authorId = AuthorId.create(newAuthorId);
    this.markAsUpdated();
  }

  updateGenres(newGenres: string[]): void {
    if (newGenres.length === 0) {
      throw new BadRequestDomainException('Book must have at least one genre');
    }
    if (newGenres.length > 5) {
      throw new BadRequestDomainException(
        'Book cannot have more than 5 genres',
      );
    }
    this._props.genres = newGenres.map((id) => GenreId.create(id));
    this.markAsUpdated();
  }

  updateDescription(description: string): void {
    this._props.description = description.trim();
    this.markAsUpdated();
  }

  updatePublishedYear(publishedYear: string): void {
    this._props.publishedYear = publishedYear.trim();
    this.markAsUpdated();
  }

  updateCoverUrl(coverUrl: string): void {
    this._props.coverUrl = coverUrl.trim();
    this.markAsUpdated();
  }

  changeStatus(newStatus: 'draft' | 'published' | 'completed'): void {
    this._props.status = BookStatus.create(newStatus);
    this.markAsUpdated();
  }

  updateTags(tags: string[]): void {
    this._props.tags = tags;
    this.markAsUpdated();
  }

  incrementViews(): void {
    this._props.views += 1;
    this.markAsUpdated();
  }

  incrementLikes(): void {
    this._props.likes += 1;
    this.markAsUpdated();
  }

  decrementLikes(): void {
    if (this._props.likes > 0) {
      this._props.likes -= 1;
      this.markAsUpdated();
    }
  }

  addLike(userId: string): void {
    if (!this._props.likedBy.includes(userId)) {
      this._props.likedBy.push(userId);
      this.incrementLikes();
    }
  }

  removeLike(userId: string): void {
    const index = this._props.likedBy.indexOf(userId);
    if (index > -1) {
      this._props.likedBy.splice(index, 1);
      this.decrementLikes();
    }
  }

  markVectorIndexed(): void {
    this._props.vectorIndexedAt = new Date();
    this.markAsUpdated();
  }

  private static generateSlug(title: string): string {
    return slugify(title, {
      lower: true,
      strict: true,
      locale: 'vi',
    });
  }
}
