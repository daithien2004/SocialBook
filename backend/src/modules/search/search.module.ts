import { Module } from '@nestjs/common';
import { SearchApplicationModule } from './application/search-application.module';
import { SearchController } from './presentation/search.controller';

@Module({
  imports: [SearchApplicationModule],
  controllers: [SearchController],
  exports: [SearchApplicationModule],
})
export class SearchModule {}
