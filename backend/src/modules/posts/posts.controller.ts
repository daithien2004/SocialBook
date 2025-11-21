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
  Query,
} from '@nestjs/common';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

import { FilesInterceptor } from '@nestjs/platform-express';
import { PaginationDto } from './dto/pagination.dto';
import { Public } from '@/src/common/decorators/customize';

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

  @Public()
  @Get()
  async findAll(@Query() query: PaginationDto) {
    // Giới hạn limit để tránh query quá nhiều data
    if (query.limit > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }

    const result = await this.postsService.findAll(query.page, query.limit);
    return {
      data: result,
    };
  }

  // Lấy chi tiết 1 post
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  // Cập nhật post
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
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

    return this.postsService.update(id, updatePostDto, files);
  }

  // Soft delete post
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }

  // Hard delete (xóa hẳn) - optional
  @Delete(':id/permanent')
  async removeHard(@Param('id') id: string) {
    return this.postsService.removeHard(id);
  }

  // Xóa một ảnh cụ thể trong post
  @Delete(':id/images')
  async removeImage(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    if (!imageUrl) {
      throw new BadRequestException('imageUrl is required');
    }

    return this.postsService.removeImage(id, imageUrl);
  }
}
