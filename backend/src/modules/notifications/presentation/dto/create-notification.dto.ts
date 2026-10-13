// notifications/dto/create-notification.dto.ts
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class NotificationMetaDto {
  @IsOptional()
  @IsUUID('4')
  actorId!: string;

  @IsOptional()
  @IsString()
  username!: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsUUID('4')
  targetId!: string;
}

export class CreateNotificationDto {
  @IsUUID('4')
  userId!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsString()
  type!: string;

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
  meta!: NotificationMetaDto;
}
