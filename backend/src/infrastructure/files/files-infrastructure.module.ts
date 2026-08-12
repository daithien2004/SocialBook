import { Module } from '@nestjs/common';
import { IEpubParserPort } from '@/domain/chapters/interfaces/epub-parser.port';
import { EpubParserAdapter } from './epub-parser.adapter';

@Module({
  providers: [
    {
      provide: IEpubParserPort,
      useClass: EpubParserAdapter,
    },
  ],
  exports: [IEpubParserPort],
})
export class FilesInfrastructureModule {}
