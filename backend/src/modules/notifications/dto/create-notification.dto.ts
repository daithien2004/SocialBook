// notifications/dto/create-notification.dto.ts
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsMongoId,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class NotificationMetaDto {
  @IsOptional()
  @IsMongoId()
  actorId: string;

  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsMongoId()
  targetId: string;
}

export class CreateNotificationDto {
  @IsMongoId()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationMetaDto)
  meta: NotificationMetaDto;
}
