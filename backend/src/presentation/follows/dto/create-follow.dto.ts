import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateFollowDto {
    @ApiProperty({ description: 'Target user ID to follow' })
    @IsMongoId()
    @IsNotEmpty()
    targetId: string;

    @ApiProperty({ description: 'Follow status', default: true })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}

export class UpdateFollowDto {
    @ApiProperty({ description: 'Follow status' })
    @IsBoolean()
    @IsNotEmpty()
    status: boolean;
}

export class FollowStatusDto {
    @ApiProperty({ description: 'User ID' })
    @IsMongoId()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'Target user ID' })
    @IsMongoId()
    @IsNotEmpty()
    targetId: string;
}

export class FollowStatsDto {
    @ApiProperty({ description: 'User ID' })
    @IsMongoId()
    @IsNotEmpty()
    userId: string;
}

import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class FilterFollowDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'User ID filter' })
    @IsOptional()
    @IsMongoId()
    userId?: string;

    @ApiPropertyOptional({ description: 'Target ID filter' })
    @IsOptional()
    @IsMongoId()
    targetId?: string;

    @ApiPropertyOptional({ description: 'Status filter' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @ApiPropertyOptional({ description: 'Date from filter' })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Date to filter' })
    @IsOptional()
    @IsString()
    dateTo?: string;
}
