import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Genre, GenreDocument } from './schemas/genre.schema';

@Injectable()
export class GenresService {
  constructor(
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
  ) {}

  async findAll() {
    const genres = await this.genreModel
      .find()
      .select('name slug')
      .sort({ name: 1 })
      .lean();

    return genres;
  }
}
