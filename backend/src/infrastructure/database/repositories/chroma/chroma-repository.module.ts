import { Module } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
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
