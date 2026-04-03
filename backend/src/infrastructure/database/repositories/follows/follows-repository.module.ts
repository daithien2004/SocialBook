import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Follow,
  FollowSchema,
} from '@/infrastructure/database/schemas/follow.schema';
import { IFollowRepository } from '@/domain/follows/repositories/follow.repository.interface';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { FollowRepository } from './follow.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }]),
    IdGeneratorModule,
  ],
  providers: [
    FollowRepository,
    {
      provide: IFollowRepository,
      useClass: FollowRepository,
    },
  ],
  exports: [FollowRepository, IFollowRepository, MongooseModule],
})
export class FollowsRepositoryModule {}
