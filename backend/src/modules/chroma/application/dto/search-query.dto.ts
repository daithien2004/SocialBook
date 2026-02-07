import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';

export class SearchQueryDto {
    @ApiProperty({ description: 'Search query text' })
    @IsString()
    @IsNotEmpty()
    query: string;

    @ApiProperty({ enum: ['book', 'author', 'chapter'], description: 'Content type filter', required: false })
    @IsOptional()
    @IsEnum(['book', 'author', 'chapter'])
    contentType?: 'book' | 'author' | 'chapter';

    @ApiProperty({ description: 'Search filters', required: false })
    @IsOptional()
    filters?: Record<string, any>;

    @ApiProperty({ description: 'Result limit', default: 10 })
    @IsOptional()
    @IsNumber()
    limit?: number;

    @ApiProperty({ description: 'Similarity threshold', default: 0.7 })
    @IsOptional()
    @IsNumber()
    threshold?: number;

    @ApiProperty({ description: 'Embedding vector', type: [Number], required: false })
    @IsOptional()
    @IsArray()
    embedding?: number[];
}
