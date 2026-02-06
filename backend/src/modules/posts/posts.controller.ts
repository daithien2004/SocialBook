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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { CreatePostDto } from './dto/create-post.dto';
import { PaginationDto, PaginationUserDto } from './dto/pagination.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

import { Public } from '@/src/common/decorators/customize';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginationDto) {
    const limit = query.limit > 100 ? 100 : query.limit;
    const result = await this.postsService.findAll(query.page, limit);
    return {
      data: { ...result },
      message: 'Get posts successfully',
    };
  }

  @Public()
  @Get('user')
  @ApiOperation({ summary: 'Get all posts by user' })
  @HttpCode(HttpStatus.OK)
  async findAllByUser(@Req() req: Request & { user?: { id: string } }, @Query() query: PaginationUserDto) {
    const limit = query.limit > 100 ? 100 : query.limit;
    const result = await this.postsService.findAllByUser(query.userId, query.page, limit);
    return {
      data: { ...result },
      message: 'Get posts successfully',
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get post details' })
  @ApiParam({ name: 'id', type: 'string' })
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
  @ApiOperation({ summary: 'Create a new post' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        bookId: { type: 'string' },
        isDelete: { type: 'boolean' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request & { user: { id: string } },
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
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        bookId: { type: 'string' },
        imageUrls: { type: 'array', items: { type: 'string' } },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
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
  @ApiOperation({ summary: 'Delete a post (Soft delete)' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.postsService.remove(id);
    return {
      message: 'Delete post successfully',
    };
  }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard) // Nên thêm Role Admin guard ở đây
  @ApiOperation({ summary: 'Delete a post permanently' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async removeHard(@Param('id') id: string) {
    await this.postsService.removeHard(id);
    return {
      message: 'Permanently deleted post',
    };
  }

  @Delete(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove an image from a post' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ schema: { type: 'object', properties: { imageUrl: { type: 'string' } } } })
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

  // ===== ADMIN ENDPOINTS =====

  @Get('admin/flagged')
  @UseGuards(JwtAuthGuard) // TODO: Add AdminGuard
  @ApiOperation({ summary: 'Get flagged posts (Admin)' })
  @HttpCode(HttpStatus.OK)
  async getFlaggedPosts(@Query() query: PaginationDto) {
    const limit = query.limit > 100 ? 100 : query.limit;
    const result = await this.postsService.getFlaggedPosts(query.page, limit);
    return {
      data: result,
      message: 'Get flagged posts successfully',
    };
  }

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard) // TODO: Add AdminGuard
  @ApiOperation({ summary: 'Approve a post (Admin)' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async approvePost(@Param('id') id: string) {
    const result = await this.postsService.approvePost(id);
    return {
      message: result.message,
    };
  }

  @Delete('admin/:id/reject')
  @UseGuards(JwtAuthGuard) // TODO: Add AdminGuard
  @ApiOperation({ summary: 'Reject a post (Admin)' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async rejectPost(@Param('id') id: string) {
    const result = await this.postsService.rejectPost(id);
    return {
      message: result.message,
    };
  }
}
