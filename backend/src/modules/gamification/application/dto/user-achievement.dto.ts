import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateUserAchievementDto {
    @ApiProperty({ description: 'User ID' })
    @IsMongoId()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'Achievement ID' })
    @IsMongoId()
    @IsNotEmpty()
    achievementId: string;

    @ApiProperty({ description: 'Reward XP', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    rewardXP?: number;
}

export class UpdateUserAchievementProgressDto {
    @ApiProperty({ description: 'Progress value' })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    progress: number;
}

export class IncrementProgressDto {
    @ApiProperty({ description: 'Amount to increment', required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    amount?: number;
}

export class FilterUserAchievementDto {
    @ApiProperty({ description: 'User ID filter', required: false })
    @IsOptional()
    @IsMongoId()
    userId?: string;

    @ApiProperty({ description: 'Achievement ID filter', required: false })
    @IsOptional()
    @IsMongoId()
    achievementId?: string;

    @ApiProperty({ description: 'Is unlocked filter', required: false })
    @IsOptional()
    @IsBoolean()
    isUnlocked?: boolean;

    @ApiProperty({ description: 'Minimum progress filter', required: false })
    @IsOptional()
    @IsNumber()
    minProgress?: number;
}

export class UserAchievementResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    achievementId: string;

    @ApiProperty()
    progress: number;

    @ApiProperty()
    isUnlocked: boolean;

    @ApiProperty()
    unlockedAt: Date | null;

    @ApiProperty()
    rewardXP: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    progressPercentage: number;
}
