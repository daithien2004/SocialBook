import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { TargetTypeEnum } from './create-comment.dto';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class FilterCommentDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'User ID filter' })
    @IsOptional()
    userId?: string;

    @ApiPropertyOptional({ enum: TargetTypeEnum, description: 'Target type filter' })
    @IsOptional()
    @IsEnum(TargetTypeEnum)
    targetType?: TargetTypeEnum;

    @ApiPropertyOptional({ description: 'Target ID filter' })
    @IsOptional()

    targetId?: string;

    @ApiPropertyOptional({ description: 'Parent comment ID filter' })
    @IsOptional()
    parentId?: string;

    @ApiPropertyOptional({ description: 'Is flagged filter' })
    @IsOptional()
    @IsBoolean()
    isFlagged?: boolean;

    @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected'], description: 'Moderation status filter' })
    @IsOptional()
    @IsEnum(['pending', 'approved', 'rejected'])
    moderationStatus?: 'pending' | 'approved' | 'rejected';

    @ApiPropertyOptional({ description: 'Search query' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Date from filter' })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Date to filter' })
    @IsOptional()
    @IsString()
    dateTo?: string;
}

import { Type } from 'class-transformer';

export class GetCommentsDto {

    @IsString()
    targetId: string;

    @IsOptional()
    parentId?: string | null;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;

    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsString()
    order?: 'asc' | 'desc';
}
