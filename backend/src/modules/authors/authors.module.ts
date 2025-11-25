import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { Author, AuthorSchema } from './schemas/author.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Author.name, schema: AuthorSchema }]),
    CloudinaryModule,
  ],
  controllers: [AuthorsController],
  providers: [AuthorsService, CloudinaryService],
  exports: [AuthorsService],
})
export class AuthorsModule { }
