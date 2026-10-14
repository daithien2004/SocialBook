import { DomainEvent } from '@/shared/domain/domain-event';

export class __Name__CreatedEvent extends DomainEvent {
  constructor(
    readonly __name__Id: string,
    readonly ownerId: string,
  ) {
    super();
  }
}
