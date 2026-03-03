import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TextToSpeech, TextToSpeechSchema } from '@/infrastructure/database/schemas/text-to-speech.schema';
import { ITextToSpeechRepository } from '@/domain/text-to-speech/repositories/text-to-speech.repository.interface';
import { TextToSpeechRepository } from './text-to-speech.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TextToSpeech.name, schema: TextToSpeechSchema }]),
  ],
  providers: [
    {
      provide: ITextToSpeechRepository,
      useClass: TextToSpeechRepository,
    },
  ],
  exports: [
    MongooseModule,
    ITextToSpeechRepository,
  ],
})
export class TextToSpeechRepositoryModule {}
