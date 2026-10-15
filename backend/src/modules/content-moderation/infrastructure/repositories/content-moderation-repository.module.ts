import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IToxicWordRepository } from '@/modules/content-moderation/domain/repositories/toxic-word.repository.interface';
import { ToxicWordRepository } from './toxic-word.repository';
import { ToxicWordReadRepository } from '@/modules/content-moderation/application/ports/toxic-word-read.repository';
import { PrismaToxicWordReadRepository } from './toxic-word-read.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IToxicWordRepository,
      useClass: ToxicWordRepository,
    },
    {
      provide: ToxicWordReadRepository,
      useClass: PrismaToxicWordReadRepository,
    },
  ],
  exports: [IToxicWordRepository, ToxicWordReadRepository],
})
export class ContentModerationRepositoryModule {}
