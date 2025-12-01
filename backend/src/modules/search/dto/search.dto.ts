import { IsString, IsOptional, IsNumber, Min, Max, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class SemanticSearchDto {
    @IsString()
    query: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(50)
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    @Type(() => Number)
    minScore?: number = 0.0;

    @IsOptional()
    @IsIn(['all', 'book', 'chapter', 'author'])
    type?: string = 'all';

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    genres?: string[];
}
