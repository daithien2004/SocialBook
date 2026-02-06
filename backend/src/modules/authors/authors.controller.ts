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
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Controller('authors')
export class AuthorsController {
    constructor(private readonly authorsService: AuthorsService) { }


    @Post()
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('photoUrl'))
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createAuthorDto: CreateAuthorDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const data = await this.authorsService.create(createAuthorDto, file);
        return {
            message: 'Tạo tác giả thành công',
            data,
        };
    }

    @Get('admin')
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async findAll(
        @Query('current') current: string = '1',
        @Query('pageSize') pageSize: string = '10',
        @Query() query: Record<string, unknown>,
    ) {
        const result = await this.authorsService.findAll(query, +current, +pageSize);
        return {
            message: 'Lấy danh sách tác giả thành công',
            data: result.data,
            meta: result.meta,
        };
    }

    @Get(':id')
    @Public()
    async findOne(@Param('id') id: string) {
        const data = await this.authorsService.findOne(id);
        return {
            message: 'Lấy thông tin tác giả thành công',
            data,
        };
    }

    @Put(':id')
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('photoUrl'))
    async update(
        @Param('id') id: string,
        @Body() updateAuthorDto: UpdateAuthorDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const data = await this.authorsService.update(id, updateAuthorDto, file);
        return {
            message: 'Cập nhật tác giả thành công',
            data,
        };
    }

    @Delete(':id')
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async remove(@Param('id') id: string) {
        await this.authorsService.remove(id);
        return {
            message: 'Xóa tác giả thành công',
        };
    }

    @Get()
    @Public()
    async getForSelect() {
        const data = await this.authorsService.getForSelect();
        return {
            message: 'Lấy danh sách tác giả thành công',
            data,
        };
    }
}



