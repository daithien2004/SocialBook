import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SearchBookResult } from '@/modules/search/application/dto/search-book-result.dto';

class SearchAuthorResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  avatar?: string;
}

class SearchGenreResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

class SearchBookStatsResponseDto {
  @ApiProperty()
  chapters!: number;

  @ApiProperty()
  views!: number;

  @ApiProperty()
  likes!: number;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  reviews!: number;
}

export class SearchBookResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  coverUrl?: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiProperty()
  views!: number;

  @ApiProperty()
  likes!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: SearchAuthorResponseDto })
  authorId!: SearchAuthorResponseDto;

  @ApiProperty({ type: SearchGenreResponseDto, isArray: true })
  genres!: SearchGenreResponseDto[];

  @ApiProperty({ type: SearchBookStatsResponseDto })
  stats!: SearchBookStatsResponseDto;

  @ApiProperty()
  score!: number;

  @ApiPropertyOptional()
  matchType?: string;

  static fromReadModel(result: SearchBookResult): SearchBookResponseDto {
    const response = new SearchBookResponseDto();
    response.id = result.id;
    response.title = result.title;
    response.slug = result.slug;
    response.description = result.description;
    response.coverUrl = result.coverUrl;
    response.status = result.status;
    response.tags = result.tags;
    response.views = result.views;
    response.likes = result.likes;
    response.createdAt = result.createdAt;
    response.updatedAt = result.updatedAt;
    response.authorId = {
      id: result.authorId.id,
      name: result.authorId.name,
      avatar: result.authorId.avatar,
    };
    response.genres = result.genres.map((genre) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
    }));
    response.stats = {
      chapters: result.stats.chapters,
      views: result.stats.views,
      likes: result.stats.likes,
      rating: result.stats.rating,
      reviews: result.stats.reviews,
    };
    response.score = result.score;
    response.matchType = result.matchType;
    return response;
  }
}
