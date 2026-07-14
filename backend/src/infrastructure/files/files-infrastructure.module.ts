import { Module } from '@nestjs/common';
import { EpubParserService } from './epub-parser.service';
import { FileImportService } from './file-import.service';

@Module({
  providers: [EpubParserService, FileImportService],
  exports: [EpubParserService, FileImportService],
})
export class FilesInfrastructureModule {}
