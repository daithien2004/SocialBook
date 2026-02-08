import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';

export class CreateUserGamificationDto {
    @ApiProperty({ description: 'User ID' })
    @IsMongoId()
    @IsNotEmpty()
    userId: string;
}

export class RecordReadingDto {
    @ApiProperty({ description: 'XP to award', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    xp?: number;
}

export class AddXPDto {
    @ApiProperty({ description: 'XP amount to add' })
    @IsNumber()
    @Min(1)
    @IsNotEmpty()
    amount: number;
}

export class UseStreakFreezeDto {
    @ApiProperty({ description: 'User ID' })
    @IsMongoId()
    @IsNotEmpty()
    userId: string;
}

export class FilterUserGamificationDto {
    @ApiProperty({ description: 'Minimum streak', required: false })
    @IsOptional()
    @IsNumber()
    minStreak?: number;

    @ApiProperty({ description: 'Maximum streak', required: false })
    @IsOptional()
    @IsNumber()
    maxStreak?: number;

    @ApiProperty({ description: 'Has active streak', required: false })
    @IsOptional()
    hasActiveStreak?: boolean;
}

export class GamificationStatsDto {
    @ApiProperty({ description: 'Total XP distributed' })
    totalXP: number;

    @ApiProperty({ description: 'Active streaks count' })
    activeStreaksCount: number;

    @ApiProperty({ description: 'Users with streak count' })
    usersWithStreakCount: number;

    @ApiProperty({ description: 'Top users by streak' })
    topUsersByStreak: any[];

    @ApiProperty({ description: 'Top users by XP' })
    topUsersByXP: any[];
}
