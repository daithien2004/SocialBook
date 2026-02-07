import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { IAuthorRepository } from '../../../domain/repositories/author.repository.interface';
import { Author } from '../../../domain/entities/author.entity';
import { AuthorId } from '../../../domain/value-objects/author-id.vo';
import { AuthorName } from '../../../domain/value-objects/author-name.vo';
import { UpdateAuthorCommand } from './update-author.command';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class UpdateAuthorUseCase {
    constructor(
        private readonly authorRepository: IAuthorRepository
    ) {}

    async execute(command: UpdateAuthorCommand): Promise<Author> {
        const authorId = AuthorId.create(command.id);
        
        const author = await this.authorRepository.findById(authorId);
        if (!author) {
            throw new NotFoundException(ErrorMessages.AUTHOR_NOT_FOUND);
        }

        // Check if name is being updated and if it conflicts with existing author
        if (command.name && command.name.trim() !== author.name.toString()) {
            const newName = AuthorName.create(command.name);
            const exists = await this.authorRepository.existsByName(newName, authorId);
            
            if (exists) {
                throw new ConflictException(ErrorMessages.AUTHOR_EXISTS);
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
