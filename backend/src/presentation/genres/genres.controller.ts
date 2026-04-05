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

import { GetGenreByIdQuery } from '@/application/genres/use-cases/get-genre-by-id/get-genre-by-id.query';
import { GetGenreByIdUseCase } from '@/application/genres/use-cases/get-genre-by-id/get-genre-by-id.use-case';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

@Controller('genres')
export class GenresController {
  constructor(
    private readonly createGenreUseCase: CreateGenreUseCase,
    private readonly updateGenreUseCase: UpdateGenreUseCase,
    private readonly getGenresUseCase: GetGenresUseCase,
    private readonly deleteGenreUseCase: DeleteGenreUseCase,
    private readonly getGenreByIdUseCase: GetGenreByIdUseCase,
  ) {}

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createGenreDto: CreateGenreDto) {
    const command = new CreateGenreCommand(
      createGenreDto.name,
      createGenreDto.description,
    );
    const genre = await this.createGenreUseCase.execute(command);
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
    const result = await this.getGenresUseCase.execute(query);

    return {
      message: 'Get genres successfully',
      data: result.data.map((genre) => new GenreResponseDto(genre)),
      meta: result.meta,
    };
  }

  @Get('admin')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAllAdmin(@Query() filter: FilterGenreDto) {
    const query = new GetGenresQuery(
      filter.actualPage,
      filter.actualLimit,
      filter.name,
    );
    const result = await this.getGenresUseCase.execute(query);

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
    const genre = await this.getGenreByIdUseCase.execute(query);
    return {
      message: 'Get genre successfully',
      data: new GenreResponseDto(genre),
    };
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    const command = new UpdateGenreCommand(
      id,
      updateGenreDto.name,
      updateGenreDto.description,
    );
    const genre = await this.updateGenreUseCase.execute(command);
    return {
      message: 'Genre updated successfully',
      data: new GenreResponseDto(genre),
    };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: string) {
    const command = new DeleteGenreCommand(id);
    await this.deleteGenreUseCase.execute(command);
    return { message: 'Genre deleted successfully' };
  }
}
