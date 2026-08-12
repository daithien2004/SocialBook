import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ToxicWord,
  ToxicWordSchema,
} from '@/infrastructure/database/schemas/toxic-word.schema';
import { IToxicWordRepository } from '@/domain/content-moderation/repositories/toxic-word.repository.interface';
import { ToxicWordRepository } from './toxic-word.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ToxicWord.name, schema: ToxicWordSchema },
    ]),
  ],
  providers: [
    {
      provide: IToxicWordRepository,
      useClass: ToxicWordRepository,
    },
  ],
  exports: [IToxicWordRepository],
})
export class ContentModerationRepositoryModule {}
