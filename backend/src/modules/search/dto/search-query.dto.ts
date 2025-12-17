import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Main search query DTO with pagination, filters, and sorting
 */
export class SearchQueryDto {
    @IsString()
    query: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 12;

    // Filters
    @IsOptional()
    @IsString()
    genres?: string; // comma-separated genre slugs

    @IsOptional()
    @IsString()
    author?: string; // author ID

    @IsOptional()
    @IsString()
    tags?: string; // comma-separated tags

    // Sorting
    @IsOptional()
    @IsString()
    sortBy?: string = 'score'; // score, updatedAt, views, rating, popular

    @IsOptional()
    @IsString()
    order?: string = 'desc'; // asc, desc
}
