import { Module } from '@nestjs/common';
import { IEpubParserPort } from '@/modules/chapters/domain/public-api';
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
