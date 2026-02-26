import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CreateGenreDto } from '@/presentation/genres/dto/create-genre.dto';
import { UpdateGenreDto } from '@/presentation/genres/dto/update-genre.dto';
import { FilterGenreDto } from '@/presentation/genres/dto/filter-genre.dto';
import { CreateGenreUseCase } from '@/application/genres/use-cases/create-genre/create-genre.use-case';
import { UpdateGenreUseCase } from '@/application/genres/use-cases/update-genre/update-genre.use-case';
import { GetGenresUseCase } from '@/application/genres/use-cases/get-genres/get-genres.use-case';
import { DeleteGenreUseCase } from '@/application/genres/use-cases/delete-genre/delete-genre.use-case';
import { CreateGenreCommand } from '@/application/genres/use-cases/create-genre/create-genre.command';
import { UpdateGenreCommand } from '@/application/genres/use-cases/update-genre/update-genre.command';
import { GetGenresQuery } from '@/application/genres/use-cases/get-genres/get-genres.query';
import { DeleteGenreCommand } from '@/application/genres/use-cases/delete-genre/delete-genre.command';
import { GenreResponseDto } from '@/presentation/genres/dto/genre.response.dto';
import { ApiTags } from '@nestjs/swagger';

import { GetGenreByIdUseCase } from '@/application/genres/use-cases/get-genre-by-id/get-genre-by-id.use-case';
import { GetGenreByIdQuery } from '@/application/genres/use-cases/get-genre-by-id/get-genre-by-id.query';

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

  @Get('admin')
  async findAllAdmin(
    @Query() filter: FilterGenreDto,
    @Query('current') current: string = '1',
    @Query('pageSize') pageSize: string = '15',
  ) {
    // Nếu ProTable gửi current/pageSize thì map nó, không thì dùng mặc định
    const query = new GetGenresQuery(Number(current), Number(pageSize), filter.name);
    const result = await this.getGenresUseCase.execute(query);

    return {
      data: result.data.map((genre) => new GenreResponseDto(genre)),
      meta: result.meta,
    };
  }

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
