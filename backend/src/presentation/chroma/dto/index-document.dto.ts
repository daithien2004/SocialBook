import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsNumber } from 'class-validator';

export class IndexDocumentDto {
    @ApiProperty({ description: 'Content ID' })
    @IsString()
    @IsNotEmpty()
    contentId: string;

    @ApiProperty({ enum: ['book', 'author', 'chapter'], description: 'Content type' })
    @IsEnum(['book', 'author', 'chapter'])
    contentType: 'book' | 'author' | 'chapter';

    @ApiProperty({ description: 'Content text' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ description: 'Metadata', required: false })
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiProperty({ description: 'Embedding vector', type: [Number] })
    @IsArray()
    @IsNumber({}, { each: true })
    embedding: number[];
}
