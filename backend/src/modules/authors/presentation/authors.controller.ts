import {
  ApiFileUpload,
  Public,
} from '@/shared/platform/decorators/custom.decorator';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
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

import { AuthorResponseDto } from './dto/author.response.dto';
import { CreateAuthorDto } from './dto/create-author.dto';
import { FilterAuthorDto } from './dto/filter-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

import { IMediaPort } from '@/modules/media/domain/public-api';
import { AuthorsService } from '../application/authors.service';

@Controller('authors')
export class AuthorsController {
  constructor(
    private readonly authorsService: AuthorsService,
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
    const author = await this.authorsService.create(
      createAuthorDto.name,
      createAuthorDto.bio,
      file ? await this.uploadFile(file) : createAuthorDto.photoUrl,
    );
    return {
      message: 'Táº¡o tÃ¡c giáº£ thÃ nh cÃ´ng',
      data: new AuthorResponseDto(author),
    };
  }

  @Get('admin')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async findAll(@Query() filter: FilterAuthorDto) {
    const result = await this.authorsService.findAll(
      filter.actualPage,
      filter.actualLimit,
      filter.name,
      filter.bio,
    );

    return {
      message: 'Láº¥y danh sÃ¡ch tÃ¡c giáº£ thÃ nh cÃ´ng',
      data: result.data.map((author) => new AuthorResponseDto(author)),
      meta: result.meta,
    };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const author = await this.authorsService.findById(id);
    return {
      message: 'Láº¥y thÃ´ng tin tÃ¡c giáº£ thÃ nh cÃ´ng',
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
    const author = await this.authorsService.update(
      id,
      updateAuthorDto.name,
      updateAuthorDto.bio,
      file ? await this.uploadFile(file) : updateAuthorDto.photoUrl,
    );
    return {
      message: 'Cáº­p nháº­t tÃ¡c giáº£ thÃ nh cÃ´ng',
      data: new AuthorResponseDto(author),
    };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string) {
    await this.authorsService.delete(id);
    return {
      message: 'XÃ³a tÃ¡c giáº£ thÃ nh cÃ´ng',
    };
  }

  @Get()
  @Public()
  async getForSelect() {
    const result = await this.authorsService.findAll(1, 1000);

    return {
      message: 'Láº¥y danh sÃ¡ch tÃ¡c giáº£ thÃ nh cÃ´ng',
      data: result.data.map((author) => new AuthorResponseDto(author)),
    };
  }

  private async uploadFile(file: Express.Multer.File): Promise<string> {
    return await this.mediaService.uploadImage(file);
  }
}
