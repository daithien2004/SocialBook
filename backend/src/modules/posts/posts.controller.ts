import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto, PaginationUserDto } from './dto/pagination.dto';

import { Public } from '@/src/common/decorators/customize';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginationDto) {
    const limit = query.limit > 100 ? 100 : query.limit;
    const result = await this.postsService.findAll(query.page, limit);
    return {
      data: {...result},
      message: 'Get posts successfully',
    };
  }

  @Get('user')
  @HttpCode(HttpStatus.OK)
  async findAllByUser(@Req() req: any,@Query() query: PaginationDto) {
    const limit = query.limit > 100 ? 100 : query.limit;
    const result = await this.postsService.findAllByUser(req.user.id ,query.page, limit);
    return {
      data: {...result},
      message: 'Get posts successfully',
    };
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const data = await this.postsService.findOne(id);
    return {
      message: 'Get post detail successfully',
      data,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: any,
    @Body() dto: CreatePostDto,
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
    const data = await this.postsService.create(req.user.id, dto, files);
    return {
      message: 'Create post successfully',
      data,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
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

    const data = await this.postsService.update(id, dto, files);
    return {
      message: 'Update post successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.postsService.remove(id);
    return {
      message: 'Delete post successfully',
    };
  }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard) // Nên thêm Role Admin guard ở đây
  @HttpCode(HttpStatus.OK)
  async removeHard(@Param('id') id: string) {
    await this.postsService.removeHard(id);
    return {
      message: 'Permanently deleted post',
    };
  }

  @Delete(':id/images')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeImage(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    if (!imageUrl) throw new BadRequestException('imageUrl is required');

    const data = await this.postsService.removeImage(id, imageUrl);
    return {
      message: 'Image removed successfully',
      data,
    };
  }
}
