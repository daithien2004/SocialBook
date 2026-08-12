import { Injectable } from '@nestjs/common';
import { IChaptersImportPort } from '@/domain/chapters/interfaces/chapters-import.port';
import { GetChaptersImportStatusQuery } from './get-chapters-import-status.query';

@Injectable()
export class GetChaptersImportStatusUseCase {
  constructor(private readonly chaptersImportQueue: IChaptersImportPort) {}

  async execute(query: GetChaptersImportStatusQuery) {
    return this.chaptersImportQueue.getStatus(query.jobId);
  }
}
