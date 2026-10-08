import { Module } from '@nestjs/common';
import { RecommendationsApplicationModule } from './application/recommendations-application.module';
import { RecommendationsController } from './presentation/recommendations.controller';

@Module({
  imports: [RecommendationsApplicationModule],
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}
