import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Book, BookSchema } from '../books/infrastructure/schemas/book.schema';
import { Author, AuthorSchema } from '../authors/infrastructure/schemas/author.schema';

// Domain layer imports (for interfaces and entities)
import { IVectorRepository } from './domain/repositories/vector.repository.interface';

// Infrastructure layer imports
import { ChromaVectorRepository } from './infrastructure/repositories/chroma-vector.repository';

// Application layer imports - Use Cases
import { IndexDocumentUseCase } from './application/use-cases/index-document/index-document.use-case';
import { SearchUseCase } from './application/use-cases/search/search.use-case';
import { BatchIndexUseCase } from './application/use-cases/batch-index/batch-index.use-case';
import { ClearCollectionUseCase } from './application/use-cases/clear-collection/clear-collection.use-case';
import { GetCollectionStatsUseCase } from './application/use-cases/get-collection-stats/get-collection-stats.use-case';

// Presentation layer imports
import { ChromaController } from './presentation/chroma.controller';

@Global()
@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: Book.name, schema: BookSchema },
            { name: Author.name, schema: AuthorSchema },
        ]),
    ],
    controllers: [ChromaController],
    providers: [
        // Repository implementation
        {
            provide: IVectorRepository,
            useClass: ChromaVectorRepository,
        },
        // Use cases
        IndexDocumentUseCase,
        SearchUseCase,
        BatchIndexUseCase,
        ClearCollectionUseCase,
        GetCollectionStatsUseCase,
    ],
    exports: [
        IVectorRepository,
        IndexDocumentUseCase,
        SearchUseCase,
        BatchIndexUseCase,
        ClearCollectionUseCase,
        GetCollectionStatsUseCase,
    ],
})
export class ChromaModule {}
