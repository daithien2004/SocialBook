import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Author, AuthorSchema } from '../schemas/author.schema';
import { IAuthorRepository } from '../../domain/repositories/author.repository.interface';
import { AuthorRepository } from './author.repository';
import { MongoPersistenceModule } from '@/shared/infrastructure/mongo-persistence.module';

@Module({
  imports: [
    MongoPersistenceModule,
    MongooseModule.forFeature([{ name: Author.name, schema: AuthorSchema }]),
  ],
  providers: [
    {
      provide: IAuthorRepository,
      useClass: AuthorRepository,
    },
  ],
  exports: [IAuthorRepository],
})
export class AuthorsRepositoryModule {}
