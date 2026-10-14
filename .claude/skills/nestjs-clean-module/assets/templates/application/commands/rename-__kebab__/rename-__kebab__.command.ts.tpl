import { Actor } from '@/shared/casl/actor';

export class Rename__Name__Command {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly actor: Actor,
  ) {}
}
