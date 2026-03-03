import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class BatchIndexDto {
    @ApiProperty({ description: 'Content IDs to index', type: [String] })
    @IsArray()
    @IsString({ each: true })
    contentIds: string[];

    @ApiProperty({ enum: ['book', 'author', 'chapter'], description: 'Content type' })
    @IsEnum(['book', 'author', 'chapter'])
    contentType: 'book' | 'author' | 'chapter';

    @ApiProperty({ description: 'Force reindex existing documents', default: false })
    @IsOptional()
    forceReindex?: boolean;
}
