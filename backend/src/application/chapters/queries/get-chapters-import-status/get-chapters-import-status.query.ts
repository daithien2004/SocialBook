import { Query } from '@nestjs/cqrs';

import { ChaptersImportStatusResult } from '@/domain/chapters/interfaces/chapters-import.port';

export class GetChaptersImportStatusQuery extends Query<ChaptersImportStatusResult> {
  constructor(public readonly jobId: string) {
    super();
  }
}
