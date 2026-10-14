import { Actor } from '@/shared/casl/actor';

export class Get__Name__Query {
  constructor(
    readonly id: string,
    readonly actor: Actor,
  ) {}
}
