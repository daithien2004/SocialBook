import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { AuthorId } from '@/domain/authors/value-objects/author-id.vo';
import { DeleteAuthorCommand } from './delete-author.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class DeleteAuthorUseCase {
    constructor(
        private readonly authorRepository: IAuthorRepository
    ) {}

    async execute(command: DeleteAuthorCommand): Promise<void> {
        if (!command.id) {
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const authorId = AuthorId.create(command.id);
        const author = await this.authorRepository.findById(authorId);

        if (!author) {
            throw new NotFoundException(ErrorMessages.AUTHOR_NOT_FOUND);
        }

        await this.authorRepository.delete(authorId);
    }
}


