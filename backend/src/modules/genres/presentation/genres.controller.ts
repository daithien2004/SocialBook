import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateGenreCommand } from '@/modules/genres/application/commands/create-genre/create-genre.command';

import { DeleteGenreCommand } from '@/modules/genres/application/commands/delete-genre/delete-genre.command';

import { GetGenresQuery } from '@/modules/genres/application/queries/get-genres/get-genres.query';

import { UpdateGenreCommand } from '@/modules/genres/application/commands/update-genre/update-genre.command';

import { Public } from '@/common/decorators/custom.decorator';
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

import { GetGenreByIdQuery } from '@/modules/genres/application/queries/get-genre-by-id/get-genre-by-id.query';

import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

@Controller('genres')
export class GenresController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async create(@Body() createGenreDto: CreateGenreDto) {
    const command = new CreateGenreCommand(
      createGenreDto.name,
      createGenreDto.description,
    );
    const genre = await this.commandBus.execute(command);
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
    const result = await this.queryBus.execute(query);

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
    const result = await this.queryBus.execute(query);

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
    const genre = await this.queryBus.execute(query);
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
    const genre = await this.commandBus.execute(command);
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
    await this.commandBus.execute(command);
    return { message: 'Genre deleted successfully' };
  }
}
