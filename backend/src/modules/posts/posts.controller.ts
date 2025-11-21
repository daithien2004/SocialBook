import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  Get,
  Request,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10)) // 'images' field, max 10 files
  async create(
    @Body('userId') userId: string,
    @Body('bookId') bookId: string,
    @Body('content') content: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
  ) {
    if (files && files.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed');
    }

    console.log(files);

    const createPostDto: CreatePostDto = {
      userId,
      bookId,
      content,
    };

    return this.postsService.create(createPostDto, files);
  }

  @Get()
  async findAll() {
    return this.postsService.findAll();
  }
}
