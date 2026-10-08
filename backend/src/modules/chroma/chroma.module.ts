import { Module } from '@nestjs/common';
import { ChromaApplicationModule } from './application/chroma-application.module';
import { ChromaController } from './presentation/chroma.controller';

@Module({
  imports: [ChromaApplicationModule],
  controllers: [ChromaController],
})
export class ChromaModule {}
