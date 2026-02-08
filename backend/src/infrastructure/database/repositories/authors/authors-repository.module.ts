import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Author, AuthorSchema } from '@/infrastructure/database/schemas/author.schema';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { AuthorRepository } from './author.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Author.name, schema: AuthorSchema }]),
  ],
  providers: [
    {
      provide: IAuthorRepository,
      useClass: AuthorRepository,
    },
  ],
  exports: [
    IAuthorRepository,
    MongooseModule,
  ],
})
export class AuthorsRepositoryModule {}
