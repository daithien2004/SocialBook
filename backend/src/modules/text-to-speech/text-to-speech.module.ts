import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TextToSpeechController } from './textToSpeech.controller';
import { TextToSpeechService } from './textToSpeech.service';
import {
  TextToSpeech,
  TextToSpeechSchema,
} from './schemas/textToSpeech.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ChaptersModule } from '../chapters/chapters.module';

@Module({
  imports: [
    CloudinaryModule,
    forwardRef(() => ChaptersModule),
    MongooseModule.forFeature([
      { name: TextToSpeech.name, schema: TextToSpeechSchema },
    ]),
  ],
  controllers: [TextToSpeechController],
  providers: [TextToSpeechService],
  exports: [TextToSpeechService],
})
export class TextToSpeechModule { }

