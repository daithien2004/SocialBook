import { Public } from '@/shared/platform/decorators/custom.decorator';
import { GenresService } from '../application/genres.service';
import { CreateGenreDto } from '@/modules/genres/presentation/dto/create-genre.dto';
import { FilterGenreDto } from '@/modules/genres/presentation/dto/filter-genre.dto';
import { GenreResponseDto } from '@/modules/genres/presentation/dto/genre.response.dto';
import { UpdateGenreDto } from '@/modules/genres/presentation/dto/update-genre.dto';
import {
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

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async create(@Body() createGenreDto: CreateGenreDto) {
    const genre = await this.genresService.create(
      createGenreDto.name,
      createGenreDto.description,
    );
    return {
      message: 'Genre created successfully',
      data: new GenreResponseDto(genre),
    };
  }

  @Public()
  @Get()
  async findAll(@Query() filter: FilterGenreDto) {
    const result = await this.genresService.findAll(
      filter.actualPage,
      filter.actualLimit,
      filter.name,
    );

    return {
      message: 'Get genres successfully',
      data: result.data.map((genre) => new GenreResponseDto(genre)),
      meta: result.meta,
    };
  }

  @Get('admin')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async findAllAdmin(@Query() filter: FilterGenreDto) {
    const result = await this.genresService.findAll(
      filter.actualPage,
      filter.actualLimit,
      filter.name,
    );

    return {
      message: 'Get genres (Admin) successfully',
      data: result.data.map((genre) => new GenreResponseDto(genre)),
      meta: result.meta,
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const genre = await this.genresService.findById(id);
    return {
      message: 'Get genre successfully',
      data: new GenreResponseDto(genre),
    };
  }

  @Patch(':id')
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
    return {
      message: 'Genre updated successfully',
      data: new GenreResponseDto(genre),
    };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string) {
    await this.genresService.delete(id);
    return { message: 'Genre deleted successfully' };
  }
}
