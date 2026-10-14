import { Actor } from '@/shared/casl/actor';

export class Create__Name__Command {
  constructor(
    readonly title: string,
    readonly actor: Actor,
  ) {}
}
