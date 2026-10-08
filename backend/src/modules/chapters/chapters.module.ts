import { Module } from '@nestjs/common';
import { ChaptersApplicationModule } from './application/chapters/chapters-application.module';
import { ChaptersController } from './presentation/chapters/chapters.controller';

@Module({
  imports: [ChaptersApplicationModule],
  controllers: [ChaptersController],
})
export class ChaptersModule {}
