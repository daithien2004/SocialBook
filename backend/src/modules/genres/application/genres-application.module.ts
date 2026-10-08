import { Module } from '@nestjs/common';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { GenresInfrastructureModule } from '../infrastructure/genres-infrastructure.module';
import { GenresService } from './genres.service';

@Module({
  imports: [
    GenresInfrastructureModule,
    BooksRepositoryModule,
    IdGeneratorModule,
  ],
  providers: [GenresService],
  exports: [GenresService],
})
export class GenresApplicationModule {}
