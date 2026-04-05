import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum AchievementCategoryEnum {
  READING = 'reading',
  STREAK = 'streak',
  SOCIAL = 'social',
  SPECIAL = 'special',
  ONBOARDING = 'onboarding',
}

export class CreateAchievementDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(AchievementCategoryEnum)
  category: AchievementCategoryEnum;

  @IsObject()
  requirement: {
    type: string;
    value: number;
    condition?: string;
  };
}

export class UpdateAchievementDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  requirement?: {
    type: string;
    value: number;
    condition?: string;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class FilterAchievementDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AchievementCategoryEnum)
  category?: AchievementCategoryEnum;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class AchievementResponseDto {
  id: string;

  code: string;

  name: string;

  description: string;

  category: string;

  requirement: {
    type: string;
    value: number;
    condition?: string;
  };

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;

  static fromArray(
    achievements: AchievementResponseDto[],
  ): AchievementResponseDto[] {
    return achievements;
  }
}
