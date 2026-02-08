
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewRepository } from './repositories/review.repository';
import { IReviewRepository } from '../domain/repositories/review.repository.interface';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    ],
    providers: [
        {
            provide: IReviewRepository,
            useClass: ReviewRepository,
        },
    ],
    exports: [
        IReviewRepository,
        MongooseModule,
    ],
})
export class ReviewsInfrastructureModule {}
