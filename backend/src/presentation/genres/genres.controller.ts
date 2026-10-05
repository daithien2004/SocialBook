import { Dispatcher } from '@/application/common/dispatcher';

import { CreateGenreCommand } from '@/application/genres/commands/create-genre/create-genre.command';

import { DeleteGenreCommand } from '@/application/genres/commands/delete-genre/delete-genre.command';

import { GetGenresQuery } from '@/application/genres/queries/get-genres/get-genres.query';

import { UpdateGenreCommand } from '@/application/genres/commands/update-genre/update-genre.command';

import { Public } from '@/common/decorators/custom.decorator';
import { CreateGenreDto } from '@/presentation/genres/dto/create-genre.dto';
import { FilterGenreDto } from '@/presentation/genres/dto/filter-genre.dto';
import { GenreResponseDto } from '@/presentation/genres/dto/genre.response.dto';
import { UpdateGenreDto } from '@/presentation/genres/dto/update-genre.dto';
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

import { GetGenreByIdQuery } from '@/application/genres/queries/get-genre-by-id/get-genre-by-id.query';

import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

@Controller('genres')
export class GenresController {
  constructor(
    private readonly dispatcher: Dispatcher,

    ) {}

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async create(@Body() createGenreDto: CreateGenreDto) {
    const command = new CreateGenreCommand(
      createGenreDto.name,
      createGenreDto.description,
    );
    const genre = await this.dispatcher.command(command);
    return {
      message: 'Genre created successfully',
      data: new GenreResponseDto(genre),
    };
  }

  @Public()
  @Get()
  async findAll(@Query() filter: FilterGenreDto) {
    const query = new GetGenresQuery(
      filter.actualPage,
      filter.actualLimit,
      filter.name,
    );
    const result = await this.dispatcher.query(query);

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
    const query = new GetGenresQuery(
      filter.actualPage,
      filter.actualLimit,
      filter.name,
    );
    const result = await this.dispatcher.query(query);

    return {
      message: 'Get genres (Admin) successfully',
      data: result.data.map((genre) => new GenreResponseDto(genre)),
      meta: result.meta,
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const query = new GetGenreByIdQuery(id);
    const genre = await this.dispatcher.query(query);
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
    const command = new UpdateGenreCommand(
      id,
      updateGenreDto.name,
      updateGenreDto.description,
    );
    const genre = await this.dispatcher.command(command);
    return {
      message: 'Genre updated successfully',
      data: new GenreResponseDto(genre),
    };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string) {
    const command = new DeleteGenreCommand(id);
    await this.dispatcher.command(command);
    return { message: 'Genre deleted successfully' };
  }
}
