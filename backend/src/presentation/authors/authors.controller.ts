import { Dispatcher } from '@/application/common/dispatcher';

import { ApiFileUpload, Public } from '@/common/decorators/custom.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';

import { AuthorResponseDto } from '@/presentation/authors/dto/author.response.dto';
import { CreateAuthorDto } from '@/presentation/authors/dto/create-author.dto';
import { FilterAuthorDto } from '@/presentation/authors/dto/filter-author.dto';
import { UpdateAuthorDto } from '@/presentation/authors/dto/update-author.dto';

import { CreateAuthorCommand } from '@/application/authors/commands/create-author/create-author.command';
import { DeleteAuthorCommand } from '@/application/authors/commands/delete-author/delete-author.command';
import { GetAuthorByIdQuery } from '@/application/authors/queries/get-author-by-id/get-author-by-id.query';
import { GetAuthorsQuery } from '@/application/authors/queries/get-authors/get-authors.query';
import { UpdateAuthorCommand } from '@/application/authors/commands/update-author/update-author.command';

import { IMediaPort } from '@/domain/cloudinary/interfaces/media.port';

@Controller('authors')
export class AuthorsController {
  constructor(
    private readonly dispatcher: Dispatcher,

    private readonly mediaService: IMediaPort,
  ) {}

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiFileUpload('photoUrl')
  async create(
    @Body() createAuthorDto: CreateAuthorDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const command = new CreateAuthorCommand(
      createAuthorDto.name,
      createAuthorDto.bio,
      file ? await this.uploadFile(file) : createAuthorDto.photoUrl,
    );

    const author = await this.dispatcher.command(command);
    return {
      message: 'Tạo tác giả thành công',
      data: new AuthorResponseDto(author),
    };
  }

  @Get('admin')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async findAll(@Query() filter: FilterAuthorDto) {
    const query = new GetAuthorsQuery(
      filter.actualPage,
      filter.actualLimit,
      filter.name,
      filter.bio,
    );

    const result = await this.dispatcher.query(query);

    return {
      message: 'Lấy danh sách tác giả thành công',
      data: result.data.map((author) => new AuthorResponseDto(author)),
      meta: result.meta,
    };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const query = new GetAuthorByIdQuery(id);
    const author = await this.dispatcher.query(query);
    return {
      message: 'Lấy thông tin tác giả thành công',
      data: new AuthorResponseDto(author),
    };
  }

  @Put(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiFileUpload('photoUrl')
  async update(
    @Param('id') id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const command = new UpdateAuthorCommand(
      id,
      updateAuthorDto.name,
      updateAuthorDto.bio,
      file ? await this.uploadFile(file) : updateAuthorDto.photoUrl,
    );

    const author = await this.dispatcher.command(command);
    return {
      message: 'Cập nhật tác giả thành công',
      data: new AuthorResponseDto(author),
    };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string) {
    const command = new DeleteAuthorCommand(id);
    await this.dispatcher.command(command);
    return {
      message: 'Xóa tác giả thành công',
    };
  }

  @Get()
  @Public()
  async getForSelect() {
    const query = new GetAuthorsQuery(1, 1000);
    const result = await this.dispatcher.query(query);

    return {
      message: 'Lấy danh sách tác giả thành công',
      data: result.data.map((author) => new AuthorResponseDto(author)),
    };
  }

  private async uploadFile(file: Express.Multer.File): Promise<string> {
    return await this.mediaService.uploadImage(file);
  }
}
