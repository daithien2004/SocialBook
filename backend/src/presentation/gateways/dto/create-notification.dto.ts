import {
  IsString,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class NotificationMetaDto {
  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  targetId?: string;
}

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationMetaDto)
  meta?: NotificationMetaDto;

  @IsOptional()
  @IsString()
  actionUrl?: string;
}
