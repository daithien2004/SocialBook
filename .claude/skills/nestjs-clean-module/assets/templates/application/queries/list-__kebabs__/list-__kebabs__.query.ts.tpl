import { Actor } from '@/shared/casl/actor';
import { PageQuery } from '@/shared/domain/page';
import { List__Names__Filter } from '../../ports/__kebab__-query.repository';

export class List__Names__Query {
  constructor(
    readonly filter: List__Names__Filter,
    readonly page: PageQuery,
    readonly actor: Actor,
  ) {}
}
