import { paginated } from '@/shared/platform/dto/paginated.dto';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { GenresService } from '../application/genres.service';
import { CreateGenreDto } from '@/modules/genres/presentation/dto/create-genre.dto';
import { FilterGenreDto } from '@/modules/genres/presentation/dto/filter-genre.dto';
import { GenreResponseDto } from '@/modules/genres/presentation/dto/genre.response.dto';
import { UpdateGenreDto } from '@/modules/genres/presentation/dto/update-genre.dto';
import {
  HttpCode,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@ApiProblemResponses()
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
  @ApiCreatedResponse({ type: GenreResponseDto })
  @Roles('admin')
  @UseGuards(RolesGuard)
  async create(@Body() createGenreDto: CreateGenreDto) {
    const genre = await this.genresService.create(
      createGenreDto.name,
      createGenreDto.description,
    );
    return new GenreResponseDto(genre);
  }

  @Public()
  @Get()
  @ApiPaginatedResponse(GenreResponseDto, 'offset')
  async findAll(@Query() filter: FilterGenreDto) {
    const result = await this.genresService.findAll(
      filter.actualPage,
      filter.actualLimit,
      filter.name,
    );

    return paginated(
      result.data.map((genre) => new GenreResponseDto(genre)),
      result.meta,
    );
  }

  @Get('admin')
  @ApiPaginatedResponse(GenreResponseDto, 'offset')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async findAllAdmin(@Query() filter: FilterGenreDto) {
    const result = await this.genresService.findAll(
      filter.actualPage,
      filter.actualLimit,
      filter.name,
    );

    return paginated(
      result.data.map((genre) => new GenreResponseDto(genre)),
      result.meta,
    );
  }

  @Public()
  @Get(':id')
  @ApiOkResponse({ type: GenreResponseDto })
  async findOne(@Param('id') id: string) {
    const genre = await this.genresService.findById(id);
    return new GenreResponseDto(genre);
  }

  @Patch(':id')
  @ApiOkResponse({ type: GenreResponseDto })
  @Roles('admin')
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    const genre = await this.genresService.update(
      id,
      updateGenreDto.name,
      updateGenreDto.description,
    );
    return new GenreResponseDto(genre);
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string) {
    await this.genresService.delete(id);
    return undefined;
  }
}
