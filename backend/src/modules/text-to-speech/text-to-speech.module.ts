import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TextToSpeechController } from './presentation/text-to-speech.controller';
import { TextToSpeech } from './domain/entities/text-to-speech.entity';
import { GenerateChapterAudioUseCase } from './application/use-cases/generate-chapter-audio.use-case';
import { GetChapterAudioUseCase } from './application/use-cases/get-chapter-audio.use-case';
import { DeleteChapterAudioUseCase } from './application/use-cases/delete-chapter-audio.use-case';
import { GenerateBookAudioUseCase } from './application/use-cases/generate-book-audio.use-case';
import { IncrementPlayCountUseCase } from './application/use-cases/increment-play-count.use-case';
import { TextToSpeechRepository } from './infrastructure/repositories/text-to-speech.repository';
import { VoiceRSSProvider } from './infrastructure/providers/voice-rss.provider';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { TextToSpeechSchema } from './infrastructure/schemas/text-to-speech.schema';
import { ITextToSpeechRepository } from './domain/repositories/text-to-speech.repository.interface';
import { ITextToSpeechProvider } from './domain/interfaces/text-to-speech.provider.interface';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: TextToSpeech.name, schema: TextToSpeechSchema },
        ]),
        CloudinaryModule,
        forwardRef(() => ChaptersModule)
    ],
    controllers: [TextToSpeechController],
    providers: [
        GenerateChapterAudioUseCase,
        GetChapterAudioUseCase,
        DeleteChapterAudioUseCase,
        GenerateBookAudioUseCase,
        IncrementPlayCountUseCase,
        { provide: ITextToSpeechRepository, useClass: TextToSpeechRepository },
        { provide: ITextToSpeechProvider, useClass: VoiceRSSProvider },
    ],
    exports: [
        // Export if needed
    ]
})
export class TextToSpeechModule { }
