import { Module } from '@nestjs/common';
import { IAuthorRepository } from '../../domain/repositories/author.repository.interface';
import { AuthorRepository } from './author.repository';

@Module({
  providers: [
    {
      provide: IAuthorRepository,
      useClass: AuthorRepository,
    },
  ],
  exports: [IAuthorRepository],
})
export class AuthorsRepositoryModule {}
