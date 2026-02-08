import { Module } from '@nestjs/common';
import { SearchController } from './presentation/search.controller';
import { IntelligentSearchUseCase } from './application/use-cases/intelligent-search.use-case';
import { ChromaModule } from '../chroma/chroma.module';
import { GeminiModule } from '../gemini/gemini.module';
import { BooksInfrastructureModule } from '../books/infrastructure/books.infrastructure.module';
import { AuthorsInfrastructureModule } from '../authors/infrastructure/authors.infrastructure.module';
import { ChaptersInfrastructureModule } from '../chapters/infrastructure/chapters.infrastructure.module';
import { ReviewsInfrastructureModule } from '../reviews/infrastructure/reviews.infrastructure.module';
import { GenresInfrastructureModule } from '../genres/infrastructure/genres.infrastructure.module';

@Module({
    imports: [
        ChromaModule,
        GeminiModule,
        BooksInfrastructureModule,
        AuthorsInfrastructureModule,
        ChaptersInfrastructureModule,
        ReviewsInfrastructureModule,
        GenresInfrastructureModule,
    ],
    controllers: [SearchController],
    providers: [IntelligentSearchUseCase],
    exports: [IntelligentSearchUseCase],
})
export class SearchModule { }
