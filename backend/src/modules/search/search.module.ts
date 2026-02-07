import { Module, forwardRef } from '@nestjs/common';
import { SearchController } from './presentation/search.controller';
import { IntelligentSearchUseCase } from './application/use-cases/intelligent-search.use-case';
import { ChromaModule } from '../chroma/chroma.module';
import { GeminiModule } from '../gemini/gemini.module';
import { BooksModule } from '../books/books.module';
import { AuthorsModule } from '../authors/authors.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { GenresModule } from '../genres/genres.module';

@Module({
    imports: [
        ChromaModule,
        GeminiModule,
        forwardRef(() => BooksModule),
        AuthorsModule,
        ChaptersModule,
        ReviewsModule,
        forwardRef(() => GenresModule),
    ],
    controllers: [SearchController],
    providers: [IntelligentSearchUseCase],
    exports: [IntelligentSearchUseCase],
})
export class SearchModule { }
