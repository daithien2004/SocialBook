// backend/src/modules/genres/genres.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Genre, GenreDocument } from './schemas/genre.schema';
import { Model } from 'mongoose';

@Injectable()
export class GenresService {
  constructor(
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
  ) {}
  async getForSelect() {
    const genres = await this.genreModel
      .find({}, 'name')
      .sort({ name: 1 })
      .lean()
      .exec();

    return genres.map((g) => ({
      id: g._id.toString(),
      name: g.name,
    }));
  }
}
