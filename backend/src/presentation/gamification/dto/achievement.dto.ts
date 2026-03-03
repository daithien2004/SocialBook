import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsNumber, IsString, IsEnum, IsBoolean, IsObject } from 'class-validator';

export enum AchievementCategoryEnum {
    READING = 'reading',
    STREAK = 'streak',
    SOCIAL = 'social',
    SPECIAL = 'special',
    ONBOARDING = 'onboarding'
}

export class CreateAchievementDto {
    @ApiProperty({ description: 'Achievement code (lowercase alphanumeric with underscores)' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ description: 'Achievement name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Achievement description' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ enum: AchievementCategoryEnum, description: 'Achievement category' })
    @IsEnum(AchievementCategoryEnum)
    category: AchievementCategoryEnum;

    @ApiProperty({ description: 'Achievement requirement' })
    @IsObject()
    requirement: {
        type: string;
        value: number;
        condition?: string;
    };
}

export class UpdateAchievementDto {
    @ApiProperty({ description: 'Achievement name', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Achievement description', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Achievement requirement', required: false })
    @IsOptional()
    @IsObject()
    requirement?: {
        type: string;
        value: number;
        condition?: string;
    };

    @ApiProperty({ description: 'Is active', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class FilterAchievementDto {
    @ApiProperty({ enum: AchievementCategoryEnum, description: 'Category filter', required: false })
    @IsOptional()
    @IsEnum(AchievementCategoryEnum)
    category?: AchievementCategoryEnum;

    @ApiProperty({ description: 'Is active filter', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Search query', required: false })
    @IsOptional()
    @IsString()
    search?: string;
}

export class AchievementResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    code: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    category: string;

    @ApiProperty()
    requirement: {
        type: string;
        value: number;
        condition?: string;
    };

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    static fromArray(achievements: AchievementResponseDto[]): AchievementResponseDto[] {
        return achievements;
    }
}
