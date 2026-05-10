import { IsEnum, IsNumber, IsOptional, IsString, IsObject, IsUUID } from 'class-validator';
import { UserEventType } from '@/domain/analytics/enums/user-event-type.enum';

export class TrackUserEventDto {
  @IsEnum(UserEventType)
  eventType: UserEventType;

  @IsOptional()
  @IsString()
  bookId?: string;

  @IsOptional()
  @IsString()
  chapterId?: string;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @IsOptional()
  @IsNumber()
  progressPercent?: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
