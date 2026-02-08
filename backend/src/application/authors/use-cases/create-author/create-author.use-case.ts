import { Injectable, ConflictException } from '@nestjs/common';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { Author } from '@/domain/authors/entities/author.entity';
import { AuthorName } from '@/domain/authors/value-objects/author-name.vo';
import { CreateAuthorCommand } from './create-author.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class CreateAuthorUseCase {
    constructor(
        private readonly authorRepository: IAuthorRepository
    ) {}

    async execute(command: CreateAuthorCommand): Promise<Author> {
        const name = AuthorName.create(command.name);
        const exists = await this.authorRepository.existsByName(name);
        
        if (exists) {
            throw new ConflictException(ErrorMessages.AUTHOR_EXISTS || 'Author already exists');
        }

        const author = Author.create({
            name: command.name,
            bio: command.bio,
            photoUrl: command.photoUrl
        });

        await this.authorRepository.save(author);

        return author;
    }
}


