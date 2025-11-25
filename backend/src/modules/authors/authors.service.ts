import {
    Injectable,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Author, AuthorDocument } from './schemas/author.schema';
import { Model, Types } from 'mongoose';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { AuthorSelectDto } from './dto/author-select.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AuthorsService {
    constructor(
        @InjectModel(Author.name)
        private readonly authorModel: Model<AuthorDocument>,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    async getForSelect(): Promise<AuthorSelectDto[]> {
        const authors = await this.findAllForSelect();
        return this.mapToSelectDto(authors);
    }

    private async findAllForSelect(): Promise<AuthorDocument[]> {
        return this.authorModel
            .find()
            .select('name bio')
            .sort({ name: 1 })
            .lean()
            .exec();
    }

    async findAll(query: any, current: number = 1, pageSize: number = 10) {
        // Build filter
        const filter: any = {};
        if (query.name) {
            filter.name = { $regex: query.name, $options: 'i' };
        }

        // Calculate pagination
        const skip = (current - 1) * pageSize;

        // Execute queries
        const [authors, total] = await Promise.all([
            this.authorModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .lean()
                .exec(),
            this.authorModel.countDocuments(filter),
        ]);

        // Map to response format
        const data = authors.map((author: any) => ({
            id: author._id.toString(),
            name: author.name,
            bio: author.bio,
            photoUrl: author.photoUrl,
            createdAt: author.createdAt,
            updatedAt: author.updatedAt,
        }));

        return {
            data,
            meta: {
                current,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    private mapToSelectDto(authors: AuthorDocument[]): AuthorSelectDto[] {
        return authors.map((author) => ({
            id: author._id.toString(),
            name: author.name,
            bio: author.bio,
        }));
    }

    async create(createAuthorDto: CreateAuthorDto, file?: Express.Multer.File) {
        // Validation
        if (!createAuthorDto.name?.trim()) {
            throw new BadRequestException('Author name is required');
        }

        // Check for duplicate name
        const existingAuthor = await this.authorModel.findOne({
            name: createAuthorDto.name.trim(),
        });

        if (existingAuthor) {
            throw new ConflictException('Author with this name already exists');
        }

        // Upload photo if provided
        let photoUrl = createAuthorDto.photoUrl || '';
        if (file) {
            photoUrl = await this.cloudinaryService.uploadImage(file);
        }

        // Create author
        const newAuthor = await this.authorModel.create({
            name: createAuthorDto.name.trim(),
            bio: createAuthorDto.bio?.trim() || '',
            photoUrl,
        });

        const saved = newAuthor.toObject();

        return {
            id: (saved._id as Types.ObjectId).toString(),
            name: saved.name,
            bio: saved.bio,
            photoUrl: saved.photoUrl,
            createdAt: (saved as any).createdAt,
            updatedAt: (saved as any).updatedAt,
        };
    }



    async findOne(id: string) {
        // Validation
        if (!id) {
            throw new BadRequestException('Author ID is required');
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid author ID format');
        }

        // Find author
        const author: any = await this.authorModel.findById(id).lean().exec();

        if (!author) {
            throw new NotFoundException(`Author with ID "${id}" not found`);
        }

        return {
            id: author._id.toString(),
            name: author.name,
            bio: author.bio,
            photoUrl: author.photoUrl,
            createdAt: author.createdAt,
            updatedAt: author.updatedAt,
        };
    }

    async update(id: string, updateAuthorDto: UpdateAuthorDto, file?: Express.Multer.File) {
        // Validation
        if (!id) {
            throw new BadRequestException('Author ID is required');
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid author ID format');
        }

        const existingAuthor = await this.authorModel.findById(id);

        if (!existingAuthor) {
            throw new NotFoundException(`Author with ID "${id}" not found`);
        }

        // Check for duplicate name if name is being changed
        if (updateAuthorDto.name?.trim() && updateAuthorDto.name.trim() !== existingAuthor.name) {
            const duplicateAuthor = await this.authorModel.findOne({
                name: updateAuthorDto.name.trim(),
                _id: { $ne: id },
            });

            if (duplicateAuthor) {
                throw new ConflictException('Author with this name already exists');
            }
        }

        // Build update data
        const updateData: any = {};
        if (updateAuthorDto.name?.trim()) updateData.name = updateAuthorDto.name.trim();
        if (updateAuthorDto.bio !== undefined) updateData.bio = updateAuthorDto.bio.trim();
        if (updateAuthorDto.photoUrl !== undefined) updateData.photoUrl = updateAuthorDto.photoUrl;

        // Upload new photo if provided
        if (file) {
            updateData.photoUrl = await this.cloudinaryService.uploadImage(file);
        }

        // Update author
        const updatedAuthor: any = await this.authorModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .lean()
            .exec();

        if (!updatedAuthor) {
            throw new InternalServerErrorException('Failed to update author');
        }

        return {
            id: updatedAuthor._id.toString(),
            name: updatedAuthor.name,
            bio: updatedAuthor.bio,
            photoUrl: updatedAuthor.photoUrl,
            createdAt: updatedAuthor.createdAt,
            updatedAt: updatedAuthor.updatedAt,
        };
    }

    async remove(id: string) {
        // Validation
        if (!id) {
            throw new BadRequestException('Author ID is required');
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid author ID format');
        }

        const author = await this.authorModel.findById(id);

        if (!author) {
            throw new NotFoundException(`Author with ID "${id}" not found`);
        }

        // Delete author
        await this.authorModel.findByIdAndDelete(id);

        return { success: true };
    }
}

