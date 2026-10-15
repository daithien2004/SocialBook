import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetUserNotificationsQuery } from './get-user-notifications.query';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { NotificationResult } from '@/modules/notifications/application/notification.result';
import { NotificationReadRepository } from '../../ports/notification-read.repository';

@QueryHandler(GetUserNotificationsQuery)
export class GetUserNotificationsHandler implements IQueryHandler<GetUserNotificationsQuery> {
  constructor(
    private readonly notificationReadRepository: NotificationReadRepository,
  ) {}

  async execute(
    query: GetUserNotificationsQuery,
  ): Promise<PageResult<NotificationResult>> {
    const offset = (query.page - 1) * query.limit;
    const page = await this.notificationReadRepository.findPageByUser(
      query.actor.ability,
      query.actor.userId,
      query.limit,
      offset,
      query.isRead,
    );
    return page;
  }
}
