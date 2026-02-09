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

import { CreatePostDto } from '@/presentation/posts/dto/create-post.dto';
import { PaginationDto, PaginationUserDto } from '@/presentation/posts/dto/pagination.dto';
import { UpdatePostDto } from '@/presentation/posts/dto/update-post.dto';

import { Public } from '@/common/decorators/customize';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

// Use Cases
import { CreatePostUseCase } from '@/application/posts/use-cases/create-post.use-case';
import { CreatePostCommand } from '@/application/posts/use-cases/create-post.command';
import { GetPostsUseCase } from '@/application/posts/use-cases/get-posts.use-case';
import { GetPostsQuery } from '@/application/posts/use-cases/get-posts.query';
import { GetPostsByUserUseCase } from '@/application/posts/use-cases/get-posts-by-user.use-case';
import { GetPostsByUserQuery } from '@/application/posts/use-cases/get-posts-by-user.query';
import { GetPostUseCase } from '@/application/posts/use-cases/get-post.use-case';
import { GetPostQuery } from '@/application/posts/use-cases/get-post.query';
import { UpdatePostUseCase } from '@/application/posts/use-cases/update-post.use-case';
import { UpdatePostCommand } from '@/application/posts/use-cases/update-post.command';
import { DeletePostUseCase } from '@/application/posts/use-cases/delete-post.use-case';
import { DeletePostCommand } from '@/application/posts/use-cases/delete-post.command';
import { RemovePostImageUseCase } from '@/application/posts/use-cases/remove-post-image.use-case';
import { RemovePostImageCommand } from '@/application/posts/use-cases/remove-post-image.command';
import { GetFlaggedPostsUseCase } from '@/application/posts/use-cases/get-flagged-posts.use-case';
import { GetFlaggedPostsQuery } from '@/application/posts/use-cases/get-flagged-posts.query';
import { ApprovePostUseCase } from '@/application/posts/use-cases/approve-post.use-case';
import { ApprovePostCommand } from '@/application/posts/use-cases/approve-post.command';
import { RejectPostUseCase } from '@/application/posts/use-cases/reject-post.use-case';
import { RejectPostCommand } from '@/application/posts/use-cases/reject-post.command';
import { PostResponseDto } from '@/presentation/posts/dto/post.response.dto';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly getPostsUseCase: GetPostsUseCase,
    private readonly getPostsByUserUseCase: GetPostsByUserUseCase,
    private readonly getPostUseCase: GetPostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    private readonly removePostImageUseCase: RemovePostImageUseCase,
    private readonly getFlaggedPostsUseCase: GetFlaggedPostsUseCase,
    private readonly approvePostUseCase: ApprovePostUseCase,
    private readonly rejectPostUseCase: RejectPostUseCase,
  ) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginationDto) {
    const limit = query.limit > 100 ? 100 : query.limit;
    const postsQuery = new GetPostsQuery(query.page, limit);
    const result = await this.getPostsUseCase.execute(postsQuery);
    return {
      message: 'Get posts successfully',
      data: PostResponseDto.fromArray(result.data), // Response DTO handles Post Entity mapping
      meta: {
        page: query.page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Public()
  @Get('user')
  @ApiOperation({ summary: 'Get all posts by user' })
  @HttpCode(HttpStatus.OK)
  async findAllByUser(@Req() req: Request & { user?: { id: string } }, @Query() query: PaginationUserDto) {
    const limit = query.limit > 100 ? 100 : query.limit;
    const postsQuery = new GetPostsByUserQuery(query.userId, query.page, limit);
    const result = await this.getPostsByUserUseCase.execute(postsQuery);
    return {
      message: 'Get posts successfully',
      data: PostResponseDto.fromArray(result.data),
      meta: {
        page: query.page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get post details' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const query = new GetPostQuery(id);
    const data = await this.getPostUseCase.execute(query);
    return {
      message: 'Get post detail successfully',
      data: new PostResponseDto(data),
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
    const command = new CreatePostCommand(req.user.id, dto.bookId, dto.content);
    const data = await this.createPostUseCase.execute(command, files);

    const responseDto = new PostResponseDto(data);
    if (data.isFlagged) {
      return {
        ...responseDto,
        warning: `Bài viết phát hiện nội dung vi phạm cần quản trị viên phê duyệt: ${data.moderationReason}`,
      }
    }

    return {
      message: 'Create post successfully',
      data: responseDto,
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
    @Req() req?: Request & { user: { id: string } }
  ) {
    if (files && files.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed');
    }

    const userId = req?.user?.id || '';
    const command = new UpdatePostCommand(userId, id, dto.content, dto.bookId, dto.imageUrls);
    const data = await this.updatePostUseCase.execute(command, files);
    return {
      message: 'Update post successfully',
      data: new PostResponseDto(data),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a post (Soft delete)' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: Request & { user: { id: string } }) {
    const userId = req.user.id;
    const command = new DeletePostCommand(userId, id, false, false); // isHardDelete=false, isAdmin=false (assuming user delete own post)
    await this.deletePostUseCase.execute(command);
    return {
      message: 'Delete post successfully',
    };
  }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a post permanently' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async removeHard(@Param('id') id: string, @Req() req: Request & { user: { id: string } }) {
    const userId = req.user.id;
    const command = new DeletePostCommand(userId, id, true, true); // isHardDelete=true, isAdmin=true
    await this.deletePostUseCase.execute(command);
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
    @Req() req: Request & { user: { id: string } }
  ) {
    if (!imageUrl) throw new BadRequestException('imageUrl is required');

    // We pass userId for potential ownership check in future
    const command = new RemovePostImageCommand(req.user.id, id, imageUrl, false);
    const data = await this.removePostImageUseCase.execute(command);
    return {
      message: 'Image removed successfully',
      data,
    };
  }

  // ===== ADMIN ENDPOINTS =====

  @Get('admin/flagged')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get flagged posts (Admin)' })
  @HttpCode(HttpStatus.OK)
  async getFlaggedPosts(@Query() query: PaginationDto) {
    const limit = query.limit > 100 ? 100 : query.limit;
    const flaggedQuery = new GetFlaggedPostsQuery(query.page, limit);
    const result = await this.getFlaggedPostsUseCase.execute(flaggedQuery);
    return {
      data: PostResponseDto.fromArray(result.data),
      meta: {
        page: query.page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      message: 'Get flagged posts successfully',
    };
  }

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Approve a post (Admin)' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async approvePost(@Param('id') id: string) {
    const command = new ApprovePostCommand(id);
    const result = await this.approvePostUseCase.execute(command);
    return {
      message: result.message,
    };
  }

  @Delete('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Reject a post (Admin)' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async rejectPost(@Param('id') id: string) {
    // For reject, maybe we want a reason?
    const command = new RejectPostCommand(id, 'Rejected by admin');
    const result = await this.rejectPostUseCase.execute(command);
    return {
      message: result.message,
    };
  }
}
