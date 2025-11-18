import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { TARGET_TYPES } from '@/src/modules/comments/constants/targetType.constant';

export class ToggleLikeDto {
  @IsMongoId()
  targetId: string;

  @IsEnum(TARGET_TYPES)
  targetType: string;
}
