import { Command } from '@nestjs/cqrs';

import { ReindexResult } from '@/modules/chroma/application/commands/reindex-all/reindex-all.handler';

export class ReindexAllCommand extends Command<ReindexResult> {
  constructor() {
    super();
  }
}
