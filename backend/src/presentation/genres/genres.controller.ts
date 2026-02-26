import { CreateGenreCommand } from '@/application/genres/use-cases/create-genre/create-genre.command';
import { CreateGenreUseCase } from '@/application/genres/use-cases/create-genre/create-genre.use-case';
import { DeleteGenreCommand } from '@/application/genres/use-cases/delete-genre/delete-genre.command';
import { DeleteGenreUseCase } from '@/application/genres/use-cases/delete-genre/delete-genre.use-case';
import { GetGenresQuery } from '@/application/genres/use-cases/get-genres/get-genres.query';
import { GetGenresUseCase } from '@/application/genres/use-cases/get-genres/get-genres.use-case';
import { UpdateGenreCommand } from '@/application/genres/use-cases/update-genre/update-genre.command';
import { UpdateGenreUseCase } from '@/application/genres/use-cases/update-genre/update-genre.use-case';
import { Public } from '@/common/decorators/customize';
import { CreateGenreDto } from '@/presentation/genres/dto/create-genre.dto';
import { FilterGenreDto } from '@/presentation/genres/dto/filter-genre.dto';
import { GenreResponseDto } from '@/presentation/genres/dto/genre.response.dto';
import { UpdateGenreDto } from '@/presentation/genres/dto/update-genre.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { GetGenreByIdQuery } from '@/application/genres/use-cases/get-genre-by-id/get-genre-by-id.query';
import { GetGenreByIdUseCase } from '@/application/genres/use-cases/get-genre-by-id/get-genre-by-id.use-case';

@ApiTags('Genres')
@Controller('genres')
export class GenresController {
  constructor(
    private readonly createGenreUseCase: CreateGenreUseCase,
    private readonly updateGenreUseCase: UpdateGenreUseCase,
    private readonly getGenresUseCase: GetGenresUseCase,
    private readonly deleteGenreUseCase: DeleteGenreUseCase,
    private readonly getGenreByIdUseCase: GetGenreByIdUseCase,
  ) { }

  @Post()
  async create(@Body() createGenreDto: CreateGenreDto) {
    const command = new CreateGenreCommand(createGenreDto.name, createGenreDto.description);
    const genre = await this.createGenreUseCase.execute(command);
    return new GenreResponseDto(genre);
  }

  @Public()
  @Get()
  async findAll(
    @Query() filter: FilterGenreDto,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const query = new GetGenresQuery(Number(page), Number(limit), filter.name);
    const result = await this.getGenresUseCase.execute(query);

    return {
      data: result.data.map(genre => new GenreResponseDto(genre)),
      meta: result.meta,
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const query = new GetGenreByIdQuery(id);
    const genre = await this.getGenreByIdUseCase.execute(query);
    return new GenreResponseDto(genre);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateGenreDto: UpdateGenreDto) {
    const command = new UpdateGenreCommand(id, updateGenreDto.name, updateGenreDto.description);
    const genre = await this.updateGenreUseCase.execute(command);
    return new GenreResponseDto(genre);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const command = new DeleteGenreCommand(id);
    await this.deleteGenreUseCase.execute(command);
    return { success: true };
  }
}
