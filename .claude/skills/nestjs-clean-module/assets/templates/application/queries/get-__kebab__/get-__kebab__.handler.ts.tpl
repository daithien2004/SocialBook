import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { __Name__NotFoundError } from '../../../domain/errors/__kebab__.errors';
import { __Name__QueryRepository } from '../../ports/__kebab__-query.repository';
import { __Name__ReadModel } from '../../read-models/__kebab__.read-model';
import { Get__Name__Query } from './get-__kebab__.query';

@QueryHandler(Get__Name__Query)
export class Get__Name__Handler implements IQueryHandler<Get__Name__Query, __Name__ReadModel> {
  constructor(private readonly queries: __Name__QueryRepository) {}

  async execute({ id, actor }: Get__Name__Query): Promise<__Name__ReadModel> {
    const model = await this.queries.findAccessibleById(actor.ability, id);
    // Không có quyền cũng trả NotFound để không lộ sự tồn tại của bản ghi.
    if (!model) throw new __Name__NotFoundError(id);
    return model;
  }
}
