import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SearchController } from './presentation/search.controller';
import { IntelligentSearchHandler } from './application/queries/intelligent-search/intelligent-search.handler';
import { SearchQueryExpansionService } from './application/services/search-query-expansion.service';
import { SearchRankingService } from './application/services/search-ranking.service';
import { RecordSearchHandler } from './application/commands/record-search/record-search.handler';
import { GetTrendingKeywordsHandler } from './application/queries/get-trending-keywords/get-trending-keywords.handler';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { ReviewsInfrastructureModule } from '@/modules/reviews/infrastructure/public-api';
import { GenresInfrastructureModule } from '@/modules/genres';
import { AuthorsInfrastructureModule } from '@/modules/authors';
import { ChromaInfrastructureModule } from '@/modules/chroma/infrastructure/public-api';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { SearchCacheModule } from './infrastructure/cache/search-cache.module';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineSearchAbilities } from './application/policies/search.ability';

@Module({
  imports: [
    CqrsModule,
    BooksRepositoryModule,
    ChaptersRepositoryModule,
    ReviewsInfrastructureModule,
    GenresInfrastructureModule,
    AuthorsInfrastructureModule,
    ChromaInfrastructureModule,
    IdGeneratorModule,
    SearchCacheModule,
  ],
  controllers: [SearchController],
  providers: [
    IntelligentSearchHandler,
    RecordSearchHandler,
    GetTrendingKeywordsHandler,
    SearchQueryExpansionService,
    SearchRankingService,
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineSearchAbilities]),
    },
    PoliciesGuard,
  ],
  exports: [SearchCacheModule],
})
export class SearchModule {}
