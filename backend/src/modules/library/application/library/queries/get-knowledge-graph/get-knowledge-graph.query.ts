import { Query } from '@nestjs/cqrs';

import { KnowledgeGraphResult } from '@/modules/library/application/library/queries/get-knowledge-graph/get-knowledge-graph.handler';

export class GetKnowledgeGraphQuery extends Query<KnowledgeGraphResult> {
  constructor(public readonly userId: string) {
    super();
  }
}
