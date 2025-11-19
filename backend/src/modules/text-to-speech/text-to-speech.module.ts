import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TextToSpeechController } from './textToSpeech.controller';
import { TextToSpeechService } from './textToSpeech.service';
import {
  TextToSpeech,
  TextToSpeechSchema,
} from './schemas/textToSpeech.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([
      { name: TextToSpeech.name, schema: TextToSpeechSchema },
    ]),
  ],
  controllers: [TextToSpeechController],
  providers: [TextToSpeechService],
  exports: [TextToSpeechService],
})
export class TextToSpeechModule {}
