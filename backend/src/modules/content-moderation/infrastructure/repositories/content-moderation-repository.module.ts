import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ToxicWordSchemaModel as ToxicWord,
  ToxicWordSchema,
} from '@/modules/content-moderation/infrastructure';
import { IToxicWordRepository } from '@/modules/content-moderation/domain/repositories/toxic-word.repository.interface';
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
