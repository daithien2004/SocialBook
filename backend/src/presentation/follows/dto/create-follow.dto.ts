import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFollowDto {
    @IsMongoId()
    @IsNotEmpty()
    targetId: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}

export class UpdateFollowDto {
    @IsBoolean()
    @IsNotEmpty()
    status: boolean;
}

export class FollowStatusDto {
    @IsMongoId()
    @IsNotEmpty()
    userId: string;

    @IsMongoId()
    @IsNotEmpty()
    targetId: string;
}

export class FollowStatsDto {
    @IsMongoId()
    @IsNotEmpty()
    userId: string;
}

import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class FilterFollowDto extends PaginationQueryDto {
    @IsOptional()
    @IsMongoId()
    userId?: string;

    @IsOptional()
    @IsMongoId()
    targetId?: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @IsOptional()
    @IsString()
    dateFrom?: string;

    @IsOptional()
    @IsString()
    dateTo?: string;
}

