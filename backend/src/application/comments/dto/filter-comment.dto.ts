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

export class GetCommentsDto {
    @ApiProperty({ description: 'Target ID' })
    @IsMongoId()
    targetId: string;

    @ApiProperty({ enum: TargetTypeEnum, description: 'Target type' })
    @IsEnum(TargetTypeEnum)
    targetType: TargetTypeEnum;

    @ApiProperty({ description: 'Parent comment ID', required: false })
    @IsOptional()
    @IsMongoId()
    parentId?: string | null;

    @ApiProperty({ description: 'Page number', required: false })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiProperty({ description: 'Limit for pagination', required: false })
    @IsOptional()
    @IsNumber()
    limit?: number;

    @ApiProperty({ description: 'Cursor for pagination', required: false })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiProperty({ description: 'Sort by field', required: false })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiProperty({ description: 'Sort order', required: false })
    @IsOptional()
    @IsString()
    order?: 'asc' | 'desc';
}
