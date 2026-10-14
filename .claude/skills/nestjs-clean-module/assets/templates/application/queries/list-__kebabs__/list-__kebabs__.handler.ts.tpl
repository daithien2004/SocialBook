import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from '@/shared/domain/page';
import { __Name__QueryRepository } from '../../ports/__kebab__-query.repository';
import { __Name__ReadModel } from '../../read-models/__kebab__.read-model';
import { List__Names__Query } from './list-__kebabs__.query';

@QueryHandler(List__Names__Query)
export class List__Names__Handler
  implements IQueryHandler<List__Names__Query, Page<__Name__ReadModel>>
{
  constructor(private readonly queries: __Name__QueryRepository) {}

  execute({ filter, page, actor }: List__Names__Query): Promise<Page<__Name__ReadModel>> {
    return this.queries.findAccessible(actor.ability, filter, page);
  }
}
