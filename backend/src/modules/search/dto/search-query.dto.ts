import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsObject, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Filter options for search queries
 */
export class SearchFiltersDto {
    @IsOptional()
    @IsString()
    authorName?: string;

    @IsOptional()
    @IsString({ each: true })
    genres?: string[];

    @IsOptional()
    @IsString()
    bookId?: string;
}

/**
 * Main search query DTO
 */
export class SearchQueryDto {
    @IsString()
    query: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number = 10;

    @IsOptional()
    @Type(() => SearchFiltersDto)
    @ValidateNested()
    filters?: SearchFiltersDto;
}
