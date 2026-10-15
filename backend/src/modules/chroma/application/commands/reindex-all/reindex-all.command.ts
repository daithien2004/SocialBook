import { Command } from '@nestjs/cqrs';

import type { ReindexResult } from '@/modules/chroma/application/chroma.result';
import type { Actor } from '@/shared/casl/actor';

export class ReindexAllCommand extends Command<ReindexResult> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
