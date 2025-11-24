import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Author, AuthorDocument } from './schemas/author.schema';
import { AuthorSelectDto } from './dto/author-select.dto';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author.name)
    private readonly authorModel: Model<AuthorDocument>,
  ) {}

  async getForSelect(): Promise<AuthorSelectDto[]> {
    const authors = await this.findAll();
    return this.mapToSelectDto(authors);
  }

  private async findAll(): Promise<AuthorDocument[]> {
    return this.authorModel
      .find()
      .select('name bio')
      .sort({ name: 1 })
      .lean()
      .exec();
  }

  private mapToSelectDto(authors: AuthorDocument[]): AuthorSelectDto[] {
    return authors.map((author) => ({
      id: author._id.toString(),
      name: author.name,
      bio: author.bio,
    }));
  }
}
