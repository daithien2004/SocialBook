import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateUserAchievementDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsMongoId()
  @IsNotEmpty()
  achievementId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rewardXP?: number;
}

export class UpdateUserAchievementProgressDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  progress: number;
}

export class IncrementProgressDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}

import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class FilterUserAchievementDto extends PaginationQueryDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsMongoId()
  achievementId?: string;

  @IsOptional()
  @IsBoolean()
  isUnlocked?: boolean;

  @IsOptional()
  @IsNumber()
  minProgress?: number;
}

export class UserAchievementResponseDto {
  id: string;

  userId: string;

  achievementId: string;

  progress: number;

  isUnlocked: boolean;

  unlockedAt: Date | null;

  rewardXP: number;

  createdAt: Date;

  updatedAt: Date;

  progressPercentage: number;
}
