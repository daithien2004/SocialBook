import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { GetUserNotificationsQuery } from '@/modules/notifications/application/queries/get-user-notification/get-user-notifications.query';

export class FilterNotificationDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isRead?: boolean;

  toQuery(actor: Actor): GetUserNotificationsQuery {
    return new GetUserNotificationsQuery(
      actor,
      this.actualPage,
      this.actualLimit,
      this.isRead,
    );
  }
}
