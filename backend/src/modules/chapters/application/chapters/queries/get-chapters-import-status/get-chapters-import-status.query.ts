import { Query } from '@nestjs/cqrs';

import { ChaptersImportStatusResult } from '@/modules/chapters/domain/chapters/interfaces/chapters-import.port';
import type { Actor } from '@/shared/casl/actor';

export class GetChaptersImportStatusQuery extends Query<ChaptersImportStatusResult> {
  constructor(
    public readonly actor: Actor,
    public readonly jobId: string,
  ) {
    super();
  }
}
