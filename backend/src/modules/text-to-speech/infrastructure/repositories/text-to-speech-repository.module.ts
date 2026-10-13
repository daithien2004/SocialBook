import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { ITextToSpeechRepository } from '@/modules/text-to-speech/domain/repositories/text-to-speech.repository.interface';
import { TextToSpeechRepository } from './text-to-speech.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: ITextToSpeechRepository,
      useClass: TextToSpeechRepository,
    },
  ],
  exports: [ITextToSpeechRepository],
})
export class TextToSpeechRepositoryModule {}
