import { Module } from '@nestjs/common';
import { GenresApplicationModule } from './application/genres-application.module';
import { GenresController } from './presentation/genres.controller';

@Module({
  imports: [GenresApplicationModule],
  controllers: [GenresController],
})
export class GenresModule {}
