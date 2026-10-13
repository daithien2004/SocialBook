import {
  ApiFileUpload,
  Public,
} from '@/shared/platform/decorators/custom.decorator';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import {
  HttpCode,
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
  ParseUUIDPipe,
} from '@nestjs/common';

import { AuthorResponseDto } from './dto/author.response.dto';
import { CreateAuthorDto } from './dto/create-author.dto';
import { FilterAuthorDto } from './dto/filter-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

import { IMediaPort } from '@/modules/media/domain/public-api';
import { AuthorsService } from '../application/authors.service';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '@/shared/platform/decorators/api-response.decorators';
import { paginate } from '@/shared/domain/pagination.types';

@ApiProblemResponses()
@Controller('authors')
export class AuthorsController {
  constructor(
    private readonly authorsService: AuthorsService,
    private readonly mediaService: IMediaPort,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: AuthorResponseDto })
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
    return new AuthorResponseDto(author);
  }

  @Get('admin')
  @ApiPaginatedResponse(AuthorResponseDto, 'offset')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async findAll(@Query() filter: FilterAuthorDto) {
    const result = await this.authorsService.findAll(
      { offset: filter.effectiveOffset, limit: filter.actualLimit },
      filter.name,
      filter.bio,
    );

    return paginate(result.items, result.total, filter, (authors) =>
      authors.map((author) => new AuthorResponseDto(author)),
    );
  }

  @Get(':id')
  @Public()
  @ApiOkResponse({ type: AuthorResponseDto })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const author = await this.authorsService.findById(id);
    return new AuthorResponseDto(author);
  }

  @Put(':id')
  @ApiOkResponse({ type: AuthorResponseDto })
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiFileUpload('photoUrl')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const author = await this.authorsService.update(
      id,
      updateAuthorDto.name,
      updateAuthorDto.bio,
      file ? await this.uploadFile(file) : updateAuthorDto.photoUrl,
    );
    return new AuthorResponseDto(author);
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    await this.authorsService.delete(id);
    return undefined;
  }

  @Get()
  @Public()
  @ApiPaginatedResponse(AuthorResponseDto, 'offset')
  async getForSelect() {
    const pagination = { actualPage: 1, actualLimit: 100 };
    const result = await this.authorsService.findAll({ offset: 0, limit: 100 });

    return paginate(result.items, result.total, pagination, (authors) =>
      authors.map((author) => new AuthorResponseDto(author)),
    );
  }

  private async uploadFile(file: Express.Multer.File): Promise<string> {
    return await this.mediaService.uploadImage(file);
  }
}
