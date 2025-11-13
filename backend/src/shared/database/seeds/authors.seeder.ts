// src/shared/database/seeds/authors.seeder.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Author } from '@/src/modules/authors/schemas/author.schema';

@Injectable()
export class AuthorsSeed implements OnApplicationBootstrap {
    constructor(@InjectModel(Author.name) private authorModel: Model<Author>) { }

    async onApplicationBootstrap() {
        await this.seedAuthors();
    }
    async run() {
        await this.seedAuthors();
    }
    async seedAuthors() {
        await this.authorModel.deleteMany({});

        const authors = [
            { _id: new Types.ObjectId(), name: 'Luna Everhart', bio: 'Bestselling fantasy author' },
            { _id: new Types.ObjectId(), name: 'Mia Clarkson', bio: 'Contemporary romance writer' },
            { _id: new Types.ObjectId(), name: 'Elena Winter', bio: 'Young adult fantasy author' },
        ];

        await this.authorModel.insertMany(authors);
        console.log('✅ Seed authors done!');
    }
}
