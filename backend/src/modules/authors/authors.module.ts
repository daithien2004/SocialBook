import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { Author, AuthorSchema } from './schemas/author.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Author.name, schema: AuthorSchema },
        ]),
    ],
    controllers: [AuthorsController],
    providers: [AuthorsService],
    exports: [AuthorsService], // ← quan trọng nếu dùng ở nơi khác
})
export class AuthorsModule { }