import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateUserGamificationDto {
    @IsMongoId()
    @IsNotEmpty()
    userId: string;
}

export class RecordReadingDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    xp?: number;
}

export class AddXPDto {
    @IsNumber()
    @Min(1)
    @IsNotEmpty()
    amount: number;
}

export class UseStreakFreezeDto {
    @IsMongoId()
    @IsNotEmpty()
    userId: string;
}

import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class FilterUserGamificationDto extends PaginationQueryDto {
    @IsOptional()
    @IsNumber()
    minStreak?: number;

    @IsOptional()
    @IsNumber()
    maxStreak?: number;

    @IsOptional()
    hasActiveStreak?: boolean;
}

export class GamificationStatsDto {
    totalXP: number;

    activeStreaksCount: number;

    usersWithStreakCount: number;

    topUsersByStreak: any[];

    topUsersByXP: any[];
}

