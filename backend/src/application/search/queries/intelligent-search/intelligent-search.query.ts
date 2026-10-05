import { Query, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from "@/common/utils/error.util";
import { calculateFuzzyScore } from "@/common/utils/string.util";
import { Injectable, Logger } from "@nestjs/common";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { IReviewRepository } from "@/domain/reviews/repositories/review.repository.interface";
import { IGenreRepository } from "@/domain/genres/repositories/genre.repository.interface";
import { IAuthorRepository } from "@/domain/authors/repositories/author.repository.interface";
import { Author } from "@/domain/authors/entities/author.entity";
import { Book } from "@/domain/books/entities/book.entity";
import { BookId } from "@/domain/books/value-objects/book-id.vo";
import { BookTitle } from "@/domain/books/value-objects/book-title.vo";
import { ICachePort } from "@/shared/domain/cache.port";
import { ITrendingKeywordCachePort } from "@/domain/search/interfaces/trending-keyword-cache.port";

import { PaginatedSearchBookResult } from '@/application/search/dto/search-book-result.dto';

export class IntelligentSearchQuery extends Query<PaginatedSearchBookResult> {
  public readonly query: string;
  public readonly page: number;
  public readonly limit: number;
  public readonly genres?: string[];
  public readonly mode: 'keyword' | 'semantic' | 'hybrid';
  public readonly sortBy:
    | 'views'
    | 'likes'
    | 'rating'
    | 'popular'
    | 'createdAt'
    | 'updatedAt'
    | 'title'
    | 'publishedYear'
    | 'score';
  public readonly order: 'asc' | 'desc';

  constructor(props: {
    query: string;
    page?: number;
    limit?: number;
    genres?: string[];
    mode?: 'keyword' | 'semantic' | 'hybrid';
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) { super(); 
    this.query = props.query;
    this.page = props.page ?? 1;
    this.limit = props.limit ?? 10;
    this.genres = props.genres;
    this.mode = props.mode ?? 'hybrid';
    this.order = props.order ?? 'desc';

    // Type-safe adaptation for search-specific sortBy
    const validSearchSortFields = [
      'views',
      'likes',
      'rating',
      'popular',
      'createdAt',
      'updatedAt',
      'title',
      'publishedYear',
      'score',
    ];

    this.sortBy =
      props.sortBy && validSearchSortFields.includes(props.sortBy)
        ? (props.sortBy as
            | 'views'
            | 'likes'
            | 'rating'
            | 'popular'
            | 'createdAt'
            | 'updatedAt'
            | 'title'
            | 'publishedYear'
            | 'score')
        : 'score';
  }
}
