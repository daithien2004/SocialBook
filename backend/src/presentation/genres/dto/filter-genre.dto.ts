import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { IsOptional, IsString } from 'class-validator';

export class FilterGenreDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    name?: string;
}

