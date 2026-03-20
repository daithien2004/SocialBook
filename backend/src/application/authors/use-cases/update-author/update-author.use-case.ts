import { Injectable } from '@nestjs/common';
import { NotFoundDomainException, ConflictDomainException, BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { Author } from '@/domain/authors/entities/author.entity';
import { AuthorId } from '@/domain/authors/value-objects/author-id.vo';
import { AuthorName } from '@/domain/authors/value-objects/author-name.vo';
import { UpdateAuthorCommand } from './update-author.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class UpdateAuthorUseCase {
    constructor(
        private readonly authorRepository: IAuthorRepository
    ) {}

    async execute(command: UpdateAuthorCommand): Promise<Author> {
        const authorId = AuthorId.create(command.id);
        
        const author = await this.authorRepository.findById(authorId);
        if (!author) {
            throw new NotFoundDomainException(ErrorMessages.AUTHOR_NOT_FOUND);
        }

        // Check if name is being updated and if it conflicts with existing author
        if (command.name && command.name.trim() !== author.name.toString()) {
            const newName = AuthorName.create(command.name);
            const exists = await this.authorRepository.existsByName(newName, authorId);
            
            if (exists) {
                throw new ConflictDomainException(ErrorMessages.AUTHOR_EXISTS);
            }
            
            author.changeName(command.name);
        }

        if (command.bio !== undefined) {
            author.updateBio(command.bio);
        }

        if (command.photoUrl !== undefined) {
            author.updatePhotoUrl(command.photoUrl);
        }

        await this.authorRepository.save(author);

        return author;
    }
}


