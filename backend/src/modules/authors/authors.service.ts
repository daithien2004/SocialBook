import {
    Injectable,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { AuthorDocument } from './schemas/author.schema';
import { AuthorsRepository } from './authors.repository';
import { Types, UpdateQuery } from 'mongoose';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AuthorModal, AuthorSelectModal } from './modals/author.modal';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class AuthorsService {
    constructor(
        private readonly authorsRepository: AuthorsRepository,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    async getForSelect(): Promise<AuthorSelectModal[]> {
        const authors = await this.authorsRepository.findAllForSelect();
        return AuthorSelectModal.fromArray(authors);
    }

    async findAll(query: Record<string, unknown>, current: number = 1, pageSize: number = 10) {
        const result = await this.authorsRepository.findAllForAdmin(query, current, pageSize);
        return {
            data: AuthorModal.fromArray(result.data),
            meta: result.meta,
        };
    }


    async create(createAuthorDto: CreateAuthorDto, file?: Express.Multer.File) {
        if (!createAuthorDto.name?.trim()) {
            throw new BadRequestException('Author name is required');
        }
        const existingAuthor = await this.authorsRepository.findByName(createAuthorDto.name.trim());

        if (existingAuthor) {
            throw new ConflictException(ErrorMessages.AUTHOR_EXISTS);
        }

        let photoUrl = createAuthorDto.photoUrl || '';
        if (file) {
            photoUrl = await this.cloudinaryService.uploadImage(file);
        }
        const newAuthor = await this.authorsRepository.create({
            name: createAuthorDto.name.trim(),
            bio: createAuthorDto.bio?.trim() || '',
            photoUrl,
        });
        return new AuthorModal(newAuthor);
    }



    async findOne(id: string) {
        if (!id || !Types.ObjectId.isValid(id)) {
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const author = await this.authorsRepository.findById(id);

        if (!author) {
            throw new NotFoundException(ErrorMessages.AUTHOR_NOT_FOUND);
        }

        return new AuthorModal(author);
    }

    async update(id: string, updateAuthorDto: UpdateAuthorDto, file?: Express.Multer.File) {
        if (!id || !Types.ObjectId.isValid(id)) {
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const existingAuthor = await this.authorsRepository.findById(id);

        if (!existingAuthor) {
            throw new NotFoundException(ErrorMessages.AUTHOR_NOT_FOUND);
        }

        if (updateAuthorDto.name?.trim() && updateAuthorDto.name.trim() !== existingAuthor.name) {
            const duplicateAuthor = await this.authorsRepository.findByName(
                updateAuthorDto.name.trim(),
                id,
            );

            if (duplicateAuthor) {
                throw new ConflictException(ErrorMessages.AUTHOR_EXISTS);
            }
        }

        const updateData: UpdateQuery<AuthorDocument> = {};
        if (updateAuthorDto.name?.trim()) updateData.name = updateAuthorDto.name.trim();
        if (updateAuthorDto.bio !== undefined) updateData.bio = updateAuthorDto.bio.trim();
        if (updateAuthorDto.photoUrl !== undefined) updateData.photoUrl = updateAuthorDto.photoUrl;
        if (file) {
            updateData.photoUrl = await this.cloudinaryService.uploadImage(file);
        }

        const updatedAuthor = await this.authorsRepository.update(id, updateData);

        if (!updatedAuthor) {
            throw new InternalServerErrorException('Failed to update author');
        }

        return new AuthorModal(updatedAuthor);
    }

    async remove(id: string) {
        if (!id || !Types.ObjectId.isValid(id)) {
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const author = await this.authorsRepository.findById(id);

        if (!author) {
            throw new NotFoundException(ErrorMessages.AUTHOR_NOT_FOUND);
        }

        await this.authorsRepository.delete(id);

        return { success: true };
    }
}

