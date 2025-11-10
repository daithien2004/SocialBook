import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Public } from '@/src/common/decorators/customize';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(@Request() req: any, @Body() createPostDto: CreatePostDto) {
    const post = await this.postsService.create(req.user.id, createPostDto);
    return {
      message: 'Post created successfully',
      data: {
        id: post._id.toString(),
        content: post.content,
        image: post.image,
        userId: post.userId.toString(),
        bookId: post.bookId.toString(),
        createdAt: post.createdAt,
      },
    };
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}
