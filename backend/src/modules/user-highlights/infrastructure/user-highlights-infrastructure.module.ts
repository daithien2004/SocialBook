import { Module } from '@nestjs/common';
import { UserHighlightsRepositoryModule } from './repositories/user-highlights-repository.module';

@Module({
  imports: [UserHighlightsRepositoryModule],
  exports: [UserHighlightsRepositoryModule],
})
export class UserHighlightsInfrastructureModule {}
