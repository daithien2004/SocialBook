import { Module } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
import { ChromaVectorRepository } from './chroma-vector.repository';

@Module({
  providers: [
    {
      provide: IVectorRepository,
      useClass: ChromaVectorRepository,
    },
  ],
  exports: [IVectorRepository],
})
export class ChromaRepositoryModule {}
