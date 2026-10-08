export {
  Review as ReviewSchemaModel,
  ReviewSchema,
} from './infrastructure/schemas/review.schema';
export type { ReviewDocument } from './infrastructure/schemas/review.schema';
export { IReviewRepository } from './domain/repositories/review.repository.interface';
export { Review as ReviewEntity } from './domain/entities/review.entity';
export { ReviewsInfrastructureModule } from './infrastructure/reviews-infrastructure.module';
export { ReviewsApplicationModule } from './application/reviews-application.module';
export { ReviewsModule } from './reviews.module';
