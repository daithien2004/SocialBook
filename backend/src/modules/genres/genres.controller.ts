import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { GenresService } from './genres.service';
import { Public } from '@/src/common/decorators/customize';

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const data = await this.genresService.findAll();
    return {
      message: 'Get list genres successfully',
      data,
    };
  }
}
