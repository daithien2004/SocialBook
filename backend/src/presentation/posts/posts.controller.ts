import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { CreatePostDto } from '@/presentation/posts/dto/create-post.dto';
import { PaginationUserDto } from '@/presentation/posts/dto/pagination.dto';
import { UpdatePostDto } from '@/presentation/posts/dto/update-post.dto';

import { Public } from '@/common/decorators/customize';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

// Use Cases
import { ApprovePostCommand } from '@/application/posts/use-cases/approve-post.command';
import { ApprovePostUseCase } from '@/application/posts/use-cases/approve-post.use-case';
import { CreatePostCommand } from '@/application/posts/use-cases/create-post.command';
import { CreatePostUseCase } from '@/application/posts/use-cases/create-post.use-case';
import { DeletePostCommand } from '@/application/posts/use-cases/delete-post.command';
import { DeletePostUseCase } from '@/application/posts/use-cases/delete-post.use-case';
import { GetFlaggedPostsQuery } from '@/application/posts/use-cases/get-flagged-posts.query';
import { GetFlaggedPostsUseCase } from '@/application/posts/use-cases/get-flagged-posts.use-case';
import { GetPostQuery } from '@/application/posts/use-cases/get-post.query';
import { GetPostUseCase } from '@/application/posts/use-cases/get-post.use-case';
import { GetPostsByUserQuery } from '@/application/posts/use-cases/get-posts-by-user.query';
import { GetPostsByUserUseCase } from '@/application/posts/use-cases/get-posts-by-user.use-case';
import { GetPostsQuery } from '@/application/posts/use-cases/get-posts.query';
import { GetPostsUseCase } from '@/application/posts/use-cases/get-posts.use-case';
import { RejectPostCommand } from '@/application/posts/use-cases/reject-post.command';
import { RejectPostUseCase } from '@/application/posts/use-cases/reject-post.use-case';
import { RemovePostImageCommand } from '@/application/posts/use-cases/remove-post-image.command';
import { RemovePostImageUseCase } from '@/application/posts/use-cases/remove-post-image.use-case';
import { UpdatePostCommand } from '@/application/posts/use-cases/update-post.command';
import { UpdatePostUseCase } from '@/application/posts/use-cases/update-post.use-case';
import { PostResponseDto } from '@/presentation/posts/dto/post.response.dto';

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
  ) {}

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto & { cursor?: string },
  ) {
    const limit = Math.min(query.actualLimit || 10, 100);
    const postsQuery = new GetPostsQuery(limit, query.cursor, userId);
    const result = await this.getPostsUseCase.execute(postsQuery);
    return {
      message: 'Get posts successfully',
      data: PostResponseDto.fromArray(result.data),
      meta: {
        limit,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    };
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get('user')
  async findAllByUser(
    @CurrentUser('id') currentUserId: string,
    @Query() query: PaginationUserDto & { cursor?: string },
  ) {
    if (!query.userId) throw new BadRequestException('userId is required');
    const limit = Math.min(query.actualLimit || 10, 100);
    const postsQuery = new GetPostsByUserQuery(
      query.userId,
      limit,
      query.cursor,
      currentUserId,
    );
    const result = await this.getPostsByUserUseCase.execute(postsQuery);
    return {
      message: 'Get posts successfully',
      data: PostResponseDto.fromArray(result.data),
      meta: {
        limit,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    };
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const query = new GetPostQuery(id, userId);
    const data = await this.getPostUseCase.execute(query);
    return {
      message: 'Get post detail successfully',
      data: new PostResponseDto(data),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @CurrentUser('id') userId: string,
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
    const command = new CreatePostCommand(userId, dto.bookId, dto.content);
    const data = await this.createPostUseCase.execute(command, files);

    const responseDto = new PostResponseDto(data);
    if (data.isFlagged) {
      return {
        message: 'Create post successfully',
        data: responseDto,
        warning: `Bài viết phát hiện nội dung vi phạm cần quản trị viên phê duyệt: ${data.moderationReason}`,
      };
    }

    return {
      message: 'Create post successfully',
      data: responseDto,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
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
    @CurrentUser('id') userId?: string,
  ) {
    if (userId && files && files.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed');
    }

    const command = new UpdatePostCommand(
      userId || '',
      id,
      dto.content,
      dto.bookId,
      dto.imageUrls,
    );
    const data = await this.updatePostUseCase.execute(command, files);
    return {
      message: 'Update post successfully',
      data: new PostResponseDto(data),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const command = new DeletePostCommand(userId, id, false, false);
    await this.deletePostUseCase.execute(command);
    return {
      message: 'Delete post successfully',
    };
  }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async removeHard(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const command = new DeletePostCommand(userId, id, true, true);
    await this.deletePostUseCase.execute(command);
    return {
      message: 'Permanently deleted post',
    };
  }

  @Delete(':id/images')
  @UseGuards(JwtAuthGuard)
  async removeImage(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!imageUrl) throw new BadRequestException('imageUrl is required');

    const command = new RemovePostImageCommand(userId, id, imageUrl, false);
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
  async getFlaggedPosts(@Query() query: PaginationQueryDto) {
    const limit = query.actualLimit > 100 ? 100 : query.actualLimit;
    const flaggedQuery = new GetFlaggedPostsQuery(query.actualPage, limit);
    const result = await this.getFlaggedPostsUseCase.execute(flaggedQuery);
    return {
      message: 'Get flagged posts successfully',
      data: PostResponseDto.fromArray(result.data),
      meta: {
        page: query.actualPage,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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
  async rejectPost(@Param('id') id: string) {
    const command = new RejectPostCommand(id, 'Rejected by admin');
    const result = await this.rejectPostUseCase.execute(command);
    return {
      message: result.message,
    };
  }
}
