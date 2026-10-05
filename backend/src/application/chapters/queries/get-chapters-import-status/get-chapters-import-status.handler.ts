import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetChaptersImportStatusQuery } from './get-chapters-import-status.query';
import { IChaptersImportPort } from '@/domain/chapters/interfaces/chapters-import.port';

@QueryHandler(GetChaptersImportStatusQuery)
export class GetChaptersImportStatusHandler implements IQueryHandler<GetChaptersImportStatusQuery, any> {
  constructor(private readonly chaptersImportQueue: IChaptersImportPort) {}

  async execute(query: GetChaptersImportStatusQuery) {
    return this.chaptersImportQueue.getStatus(query.jobId);
  }
}
