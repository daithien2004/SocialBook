import { Module } from '@nestjs/common';
import { TextToSpeechApplicationModule } from './application/text-to-speech-application.module';
import { TextToSpeechController } from './presentation/text-to-speech.controller';

@Module({
  imports: [TextToSpeechApplicationModule],
  controllers: [TextToSpeechController],
})
export class TextToSpeechModule {}
