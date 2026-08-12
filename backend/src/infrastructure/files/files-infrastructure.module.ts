import { Module } from '@nestjs/common';
import { IEpubParser } from '@/domain/chapters/interfaces/epub-parser.interface';
import { EpubParserService } from './epub-parser.service';

@Module({
  providers: [
    {
      provide: IEpubParser,
      useClass: EpubParserService,
    },
  ],
  exports: [IEpubParser],
})
export class FilesInfrastructureModule {}
