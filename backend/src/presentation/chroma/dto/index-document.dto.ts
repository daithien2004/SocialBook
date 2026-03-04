import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class IndexDocumentDto {
    @IsString()
    @IsNotEmpty()
    contentId: string;

    @IsEnum(['book', 'author', 'chapter'])
    contentType: 'book' | 'author' | 'chapter';

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsOptional()
    metadata?: Record<string, any>;

    @IsArray()
    @IsNumber({}, { each: true })
    embedding: number[];
}

