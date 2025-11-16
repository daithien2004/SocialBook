// src/shared/database/seeds/genres.seeder.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Genre } from '@/src/modules/genres/schemas/genre.schema';

@Injectable()
export class GenresSeed implements OnApplicationBootstrap {
    constructor(@InjectModel(Genre.name) private genreModel: Model<Genre>) { }

    async onApplicationBootstrap() {
        await this.seedGenres();
    }
    async run() {
        await this.seedGenres();
    }
    async seedGenres() {
        await this.genreModel.deleteMany({});

        const genres = [
            { _id: new Types.ObjectId(), name: 'Fantasy', description: 'Fantasy books' },
            { _id: new Types.ObjectId(), name: 'Romance', description: 'Romantic stories' },
            { _id: new Types.ObjectId(), name: 'Magic', description: 'Magic & wizardry' },
            { _id: new Types.ObjectId(), name: 'Adventure', description: 'Adventure stories' },
            { _id: new Types.ObjectId(), name: 'Contemporary', description: 'Modern life stories' },
        ];

        await this.genreModel.insertMany(genres);
        console.log('✅ Seed genres done!');
    }
}
