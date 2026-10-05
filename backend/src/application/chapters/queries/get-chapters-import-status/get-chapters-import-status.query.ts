import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IChaptersImportPort } from "@/domain/chapters/interfaces/chapters-import.port";

import { ChaptersImportStatusResult } from '@/domain/chapters/interfaces/chapters-import.port';

export class GetChaptersImportStatusQuery extends Query<ChaptersImportStatusResult> {
  constructor(public readonly jobId: string) { super(); }
}
