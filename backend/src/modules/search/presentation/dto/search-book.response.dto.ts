import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SearchAuthorResponseDto {
  @ApiProperty()
  _id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  avatar?: string;
}

class SearchGenreResponseDto {
  @ApiProperty()
  _id!: string;

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
  _id!: string;

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
}
