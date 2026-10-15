import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { TextToSpeechRepository } from '@/modules/text-to-speech/domain/repositories/text-to-speech.repository';
import { PrismaTextToSpeechRepository } from './prisma-text-to-speech.repository';
import { TextToSpeechReadRepository } from '../../application/ports/text-to-speech-read.repository';
import { PrismaTextToSpeechReadRepository } from './prisma-text-to-speech-read.repository';
import { TextToSpeechPlayCountStore } from '../../application/ports/text-to-speech-play-count.store';
import { PrismaTextToSpeechPlayCountStore } from './prisma-text-to-speech-play-count.store';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: TextToSpeechRepository,
      useClass: PrismaTextToSpeechRepository,
    },
    {
      provide: TextToSpeechReadRepository,
      useClass: PrismaTextToSpeechReadRepository,
    },
    {
      provide: TextToSpeechPlayCountStore,
      useClass: PrismaTextToSpeechPlayCountStore,
    },
  ],
  exports: [
    TextToSpeechRepository,
    TextToSpeechReadRepository,
    TextToSpeechPlayCountStore,
  ],
})
export class TextToSpeechPersistenceModule {}
