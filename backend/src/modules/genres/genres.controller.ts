import { Public } from '@/src/common/decorators/customize';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { GenresService } from './genres.service';

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) { }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGenreDto: CreateGenreDto) {
    const data = await this.genresService.create(createGenreDto);
    return {
      message: 'Tạo thể loại thành công',
      data,
    };
  }

  @Get('admin')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query('current') current: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query() query: any,
  ) {
    const result = await this.genresService.findAll(query, +current, +pageSize);
    return {
      message: 'Lấy danh sách thể loại thành công',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const data = await this.genresService.findOne(id);
    return {
      message: 'Lấy thông tin thể loại thành công',
      data,
    };
  }

  @Put(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    const data = await this.genresService.update(id, updateGenreDto);
    return {
      message: 'Cập nhật thể loại thành công',
      data,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: string) {
    await this.genresService.remove(id);
    return {
      message: 'Xóa thể loại thành công',
    };
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async findAllSimple() {
    const data = await this.genresService.findAllSimple();
    return {
      message: 'Lấy danh sách thể loại thành công',
      data,
    };
  }
}
