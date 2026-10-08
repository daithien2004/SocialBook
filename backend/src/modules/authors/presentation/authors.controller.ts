import { paginated } from '@/shared/platform/dto/paginated.dto';
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
      filter.actualPage,
      filter.actualLimit,
      filter.name,
      filter.bio,
    );

    return paginated(
      result.data.map((author) => new AuthorResponseDto(author)),
      result.meta,
    );
  }

  @Get(':id')
  @Public()
  @ApiOkResponse({ type: AuthorResponseDto })
  async findOne(@Param('id') id: string) {
    const author = await this.authorsService.findById(id);
    return new AuthorResponseDto(author);
  }

  @Put(':id')
  @ApiOkResponse({ type: AuthorResponseDto })
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
    return new AuthorResponseDto(author);
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string) {
    await this.authorsService.delete(id);
    return undefined;
  }

  @Get()
  @Public()
  @ApiPaginatedResponse(AuthorResponseDto, 'offset')
  async getForSelect() {
    const result = await this.authorsService.findAll(1, 1000);

    return paginated(
      result.data.map((author) => new AuthorResponseDto(author)),
      result.meta,
    );
  }

  private async uploadFile(file: Express.Multer.File): Promise<string> {
    return await this.mediaService.uploadImage(file);
  }
}
