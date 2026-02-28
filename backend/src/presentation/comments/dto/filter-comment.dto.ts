import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { TargetTypeEnum } from './create-comment.dto';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class FilterCommentDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'User ID filter' })
    @IsOptional()
    @IsMongoId()
    userId?: string;

    @ApiPropertyOptional({ enum: TargetTypeEnum, description: 'Target type filter' })
    @IsOptional()
    @IsEnum(TargetTypeEnum)
    targetType?: TargetTypeEnum;

    @ApiPropertyOptional({ description: 'Target ID filter' })
    @IsOptional()
    @IsMongoId()
    targetId?: string;

    @ApiPropertyOptional({ description: 'Parent comment ID filter' })
    @IsOptional()
    @IsMongoId()
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

export class GetCommentsDto extends PaginationQueryDto {
    @ApiProperty({ description: 'Target ID' })
    @IsMongoId()
    targetId: string;

    @ApiProperty({ enum: TargetTypeEnum, description: 'Target type' })
    @IsEnum(TargetTypeEnum)
    targetType: TargetTypeEnum;

    @ApiPropertyOptional({ description: 'Parent comment ID' })
    @IsOptional()
    @IsMongoId()
    parentId?: string | null;

    @ApiPropertyOptional({ description: 'Cursor for pagination' })
    @IsOptional()
    @IsString()
    cursor?: string;
}
