// notifications/dto/create-notification.dto.ts
import {
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Actor } from '@/shared/casl/actor';
import { CreateNotificationCommand } from '@/modules/notifications/application/commands/create-notification/create-notification.command';
import type { NotificationMeta } from '@/modules/notifications/domain/entities/notification.entity';

class NotificationMetaDto {
  @IsOptional()
  @IsUUID('4')
  actorId?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsUUID('4')
  targetId?: string;
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
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationMetaDto)
  meta?: NotificationMetaDto;

  toCommand(actor: Actor): CreateNotificationCommand {
    const meta: NotificationMeta | undefined = this.meta
      ? {
          actorId: this.meta.actorId,
          username: this.meta.username,
          image: this.meta.image,
          targetId: this.meta.targetId,
        }
      : undefined;

    return new CreateNotificationCommand(
      actor,
      this.userId,
      this.title,
      this.message,
      this.type,
      meta,
      this.actionUrl,
    );
  }
}
