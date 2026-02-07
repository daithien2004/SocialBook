import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
    @IsString()
    @IsOptional()
    query: string = '';

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 12;

    @IsOptional()
    @IsString()
    genres?: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsString()
    tags?: string;

    @IsOptional()
    @IsEnum(['views', 'likes', 'rating', 'popular', 'createdAt', 'updatedAt', 'score'])
    sortBy?: 'views' | 'likes' | 'rating' | 'popular' | 'createdAt' | 'updatedAt' | 'score' = 'score';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    order?: 'asc' | 'desc' = 'desc';
}
