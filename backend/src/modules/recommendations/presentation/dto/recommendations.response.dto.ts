import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import type {
  RecommendationAnalysisReadModel,
  RecommendationBookReadModel,
  RecommendationItemReadModel,
  RecommendationsReadModel,
} from '../../application/read-models/recommendations.read-model';

class RecommendationGenreResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

class RecommendationAuthorResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  avatar?: string;
}

class RecommendationBookResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  coverUrl?: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  likes: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty({ type: [RecommendationGenreResponseDto] })
  genres: RecommendationGenreResponseDto[];

  @ApiPropertyOptional({ type: RecommendationAuthorResponseDto })
  authorId?: RecommendationAuthorResponseDto;

  private constructor(book: RecommendationBookReadModel) {
    this.id = book.id;
    this.title = book.title;
    this.slug = book.slug;
    this.description = book.description;
    this.coverUrl = book.coverUrl;
    this.views = book.views;
    this.likes = book.likes;
    this.status = book.status;
    this.isDeleted = book.isDeleted;
    this.genres = book.genres.map((genre) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
    }));
    this.authorId = book.author
      ? {
          id: book.author.id,
          name: book.author.name,
          avatar: book.author.avatar,
        }
      : undefined;
  }

  static fromReadModel(book: RecommendationBookReadModel) {
    return new RecommendationBookResponseDto(book);
  }
}

class RecommendationItemResponseDto {
  @ApiProperty()
  bookId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  matchScore: number;

  @ApiProperty()
  slug: string;

  @ApiProperty({ type: RecommendationBookResponseDto })
  book: RecommendationBookResponseDto;

  private constructor(item: RecommendationItemReadModel) {
    this.bookId = item.bookId;
    this.title = item.title;
    this.reason = item.reason;
    this.matchScore = item.matchScore;
    this.slug = item.slug;
    this.book = RecommendationBookResponseDto.fromReadModel(item.book);
  }

  static fromReadModel(item: RecommendationItemReadModel) {
    return new RecommendationItemResponseDto(item);
  }
}

class RecommendationAnalysisResponseDto {
  @ApiProperty({ type: [String] })
  favoriteGenres: string[];

  @ApiProperty({ enum: ['fast', 'medium', 'slow'] })
  readingPace: RecommendationAnalysisReadModel['readingPace'];

  @ApiProperty({ enum: ['short', 'medium', 'long'] })
  preferredLength: RecommendationAnalysisReadModel['preferredLength'];

  @ApiProperty({ type: [String] })
  themes: string[];

  private constructor(analysis: RecommendationAnalysisReadModel) {
    this.favoriteGenres = [...analysis.favoriteGenres];
    this.readingPace = analysis.readingPace;
    this.preferredLength = analysis.preferredLength;
    this.themes = [...analysis.themes];
  }

  static fromReadModel(analysis: RecommendationAnalysisReadModel) {
    return new RecommendationAnalysisResponseDto(analysis);
  }
}

class RecommendationPaginationMetaResponseDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

@ApiExtraModels(
  RecommendationGenreResponseDto,
  RecommendationAuthorResponseDto,
  RecommendationBookResponseDto,
  RecommendationItemResponseDto,
  RecommendationAnalysisResponseDto,
  RecommendationPaginationMetaResponseDto,
)
export class RecommendationsResponseDto {
  @ApiProperty({ type: [RecommendationItemResponseDto] })
  data: RecommendationItemResponseDto[];

  @ApiProperty({ type: RecommendationPaginationMetaResponseDto })
  meta: RecommendationPaginationMetaResponseDto;

  @ApiProperty({ type: RecommendationAnalysisResponseDto })
  analysis: RecommendationAnalysisResponseDto;

  private constructor(result: RecommendationsReadModel) {
    this.data = result.recommendations.map((item) =>
      RecommendationItemResponseDto.fromReadModel(item),
    );
    this.meta = { ...result.meta };
    this.analysis = RecommendationAnalysisResponseDto.fromReadModel(
      result.analysis,
    );
  }

  static fromReadModel(result: RecommendationsReadModel) {
    return new RecommendationsResponseDto(result);
  }
}
