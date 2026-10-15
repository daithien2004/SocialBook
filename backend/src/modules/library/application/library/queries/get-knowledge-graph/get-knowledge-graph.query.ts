import { Query } from '@nestjs/cqrs';

import type { KnowledgeGraphResult } from '@/modules/library/application/library/knowledge-graph.result';
import type { Actor } from '@/shared/casl/actor';

export class GetKnowledgeGraphQuery extends Query<KnowledgeGraphResult> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
  ) {
    super();
  }
}
