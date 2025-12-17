import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Search query DTO with pagination, filters, and sorting
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
    limit?: number = 20;

    @IsOptional()
    @IsString()
    genres?: string;

    @IsOptional()
    @IsString()
    tags?: string;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsString()
    order?: string;
}
