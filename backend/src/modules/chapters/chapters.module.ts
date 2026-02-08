import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../books/infrastructure/schemas/book.schema';
import { TextToSpeechModule } from '../text-to-speech/text-to-speech.module';
import { ChaptersInfrastructureModule } from './infrastructure/chapters.infrastructure.module';

// Domain layer imports (for interfaces and entities)
import { IChapterRepository } from './domain/repositories/chapter.repository.interface';

// Infrastructure layer imports
import { ChapterRepository } from './infrastructure/repositories/chapter.repository';

// Application layer imports - Use Cases
import { CreateChapterUseCase } from './application/use-cases/create-chapter/create-chapter.use-case';
import { UpdateChapterUseCase } from './application/use-cases/update-chapter/update-chapter.use-case';
import { GetChaptersUseCase } from './application/use-cases/get-chapters/get-chapters.use-case';
import { GetChapterByIdUseCase } from './application/use-cases/get-chapter-by-id/get-chapter-by-id.use-case';
import { DeleteChapterUseCase } from './application/use-cases/delete-chapter/delete-chapter.use-case';

// Presentation layer imports
import { ChaptersController } from './presentation/chapters.controller';

// Legacy services (keep for now)
import { FileImportService } from './infrastructure/services/file-import.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    ChaptersInfrastructureModule,
    CloudinaryModule,
  ],
  controllers: [ChaptersController],
  providers: [
    // Use cases
    CreateChapterUseCase,
    UpdateChapterUseCase,
    GetChaptersUseCase,
    GetChapterByIdUseCase,
    DeleteChapterUseCase,
    // Legacy services
    FileImportService,
  ],
  exports: [
    ChaptersInfrastructureModule,
    CreateChapterUseCase,
    UpdateChapterUseCase,
    GetChaptersUseCase,
    GetChapterByIdUseCase,
    DeleteChapterUseCase,
  ],
})
export class ChaptersModule {}