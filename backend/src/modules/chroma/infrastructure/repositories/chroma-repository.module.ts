import { Module } from '@nestjs/common';
import { IVectorRepository } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import { ChromaConnectionFactory } from './chroma-connection.factory';
import { ChromaVectorRepository } from './chroma-vector.repository';

@Module({
  providers: [
    ChromaConnectionFactory,
    {
      provide: IVectorRepository,
      useClass: ChromaVectorRepository,
    },
  ],
  exports: [IVectorRepository],
})
export class ChromaRepositoryModule {}
