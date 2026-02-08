
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Author, AuthorSchema } from './schemas/author.schema';
import { AuthorRepository } from './repositories/author.repository';
import { IAuthorRepository } from '../domain/repositories/author.repository.interface';

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
    ],
})
export class AuthorsInfrastructureModule {}
