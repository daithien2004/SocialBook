import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Author, AuthorDocument } from './schemas/author.schema';
import { Model } from 'mongoose';
@Injectable()
export class AuthorsService {
    constructor(
        @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    ) { }
    async getForSelect() {
        const authors = await this.authorModel
            .find({}, 'name')
            .sort({ name: 1 })
            .lean()
            .exec();

        return authors.map((a) => ({
            id: a._id.toString(),
            name: a.name,
        }));
    }
}