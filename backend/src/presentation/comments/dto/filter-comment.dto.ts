import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { TargetTypeEnum } from './create-comment.dto';

export class FilterCommentDto {
    @ApiProperty({ description: 'User ID filter', required: false })
    @IsOptional()
    @IsMongoId()
    userId?: string;

    @ApiProperty({ enum: TargetTypeEnum, description: 'Target type filter', required: false })
    @IsOptional()
    @IsEnum(TargetTypeEnum)
    targetType?: TargetTypeEnum;

    @ApiProperty({ description: 'Target ID filter', required: false })
    @IsOptional()
    @IsMongoId()
    targetId?: string;

    @ApiProperty({ description: 'Parent comment ID filter', required: false })
    @IsOptional()
    @IsMongoId()
    parentId?: string;

    @ApiProperty({ description: 'Is flagged filter', required: false })
    @IsOptional()
    @IsBoolean()
    isFlagged?: boolean;

    @ApiProperty({ enum: ['pending', 'approved', 'rejected'], description: 'Moderation status filter', required: false })
    @IsOptional()
    @IsEnum(['pending', 'approved', 'rejected'])
    moderationStatus?: 'pending' | 'approved' | 'rejected';

    @ApiProperty({ description: 'Search query', required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ description: 'Date from filter', required: false })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiProperty({ description: 'Date to filter', required: false })
    @IsOptional()
    @IsString()
    dateTo?: string;
}

import { Type } from 'class-transformer';

export class GetCommentsDto {

    @IsMongoId()
    targetId: string;

    @IsOptional()
    @IsMongoId()
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
