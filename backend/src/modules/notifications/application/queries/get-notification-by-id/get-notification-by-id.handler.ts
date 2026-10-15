import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotificationReadRepository } from '../../ports/notification-read.repository';
import { GetNotificationByIdQuery } from './get-notification-by-id.query';

@QueryHandler(GetNotificationByIdQuery)
export class GetNotificationByIdHandler implements IQueryHandler<GetNotificationByIdQuery> {
  constructor(private readonly readRepository: NotificationReadRepository) {}

  execute(query: GetNotificationByIdQuery) {
    return this.readRepository.findAccessibleById(
      query.actor.ability,
      query.id,
    );
  }
}
