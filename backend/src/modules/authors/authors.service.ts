import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Author, AuthorDocument } from './schemas/author.schema';
import { Model, Types } from 'mongoose';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorsService {
    constructor(
        @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    ) { }

    async create(createAuthorDto: CreateAuthorDto) {
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

        // Create author
        const newAuthor = await this.authorModel.create({
            name: createAuthorDto.name.trim(),
            bio: createAuthorDto.bio?.trim() || '',
            photoUrl: createAuthorDto.photoUrl || '',
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

    async findAll(query: any, current: number, pageSize: number) {
        const { name } = query;
        const filter: any = {};

        // Search by name
        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        const skip = (current - 1) * pageSize;

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

        return {
            meta: {
                current,
                pageSize,
                total,
                pages: Math.ceil(total / pageSize),
            },
            result: authors.map((author: any) => ({
                id: author._id.toString(),
                name: author.name,
                bio: author.bio,
                photoUrl: author.photoUrl,
                createdAt: author.createdAt,
                updatedAt: author.updatedAt,
            })),
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

    async update(id: string, updateAuthorDto: UpdateAuthorDto) {
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

    async getForSelect() {
        const authors = await this.authorModel
            .find({}, 'name')
            .sort({ name: 1 })
            .lean()
            .exec();

        return authors.map((a: any) => ({
            id: a._id.toString(),
            name: a.name,
        }));
    }
}