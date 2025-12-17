// notifications/dto/create-notification.dto.ts
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString() userId: string;        // người nhận
  @IsString() title: string;
  @IsString() message: string;
  @IsString() type: string;           // "like" | "comment" | "message" | ...
  @IsOptional() @IsBoolean() isRead?: boolean;
  // bạn có thể thêm meta (postId, commentId...) nếu cần
  @IsOptional() meta?: Record<string, any>;
}
