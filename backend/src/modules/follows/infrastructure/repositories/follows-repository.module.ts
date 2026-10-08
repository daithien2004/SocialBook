import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Follow,
  FollowSchema,
} from '@/modules/follows/infrastructure/schemas/follow.schema';
import { IFollowRepository } from '@/modules/follows/domain/repositories/follow.repository.interface';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { FollowRepository } from './follow.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }]),
    IdGeneratorModule,
  ],
  providers: [
    {
      provide: IFollowRepository,
      useClass: FollowRepository,
    },
  ],
  exports: [IFollowRepository],
})
export class FollowsRepositoryModule {}
