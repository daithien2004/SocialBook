import { Module } from '@nestjs/common';
import { ChromaRepositoryModule } from './repositories/chroma-repository.module';

@Module({
  imports: [ChromaRepositoryModule],
  exports: [ChromaRepositoryModule],
})
export class ChromaInfrastructureModule {}
