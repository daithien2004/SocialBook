import { Injectable } from '@nestjs/common';
import { IChaptersImportService } from '@/domain/chapters/interfaces/chapters-import.interface';
import { GetChaptersImportStatusQuery } from './get-chapters-import-status.query';

@Injectable()
export class GetChaptersImportStatusUseCase {
  constructor(private readonly chaptersImportService: IChaptersImportService) {}

  async execute(query: GetChaptersImportStatusQuery) {
    return this.chaptersImportService.getStatus(query.jobId);
  }
}
