import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IToxicWordRepository } from '@/modules/content-moderation/domain/repositories/toxic-word.repository.interface';
import { ToxicWordRepository } from './toxic-word.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IToxicWordRepository,
      useClass: ToxicWordRepository,
    },
  ],
  exports: [IToxicWordRepository],
})
export class ContentModerationRepositoryModule {}
