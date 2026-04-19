import { Injectable } from '@nestjs/common';
import { ChaptersImportService } from '@/infrastructure/queues/chapters-import/chapters-import.service';
import { GetChaptersImportStatusQuery } from './get-chapters-import-status.query';

@Injectable()
export class GetChaptersImportStatusUseCase {
  constructor(private readonly chaptersImportService: ChaptersImportService) {}

  async execute(query: GetChaptersImportStatusQuery) {
    return this.chaptersImportService.getStatus(query.jobId);
  }
}
