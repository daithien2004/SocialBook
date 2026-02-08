import { Public } from '@/common/decorators/customize';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
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
import { ApiTags } from '@nestjs/swagger';

import { CreateAuthorDto } from '@/presentation/authors/dto/create-author.dto';
import { UpdateAuthorDto } from '@/presentation/authors/dto/update-author.dto';
import { FilterAuthorDto } from '@/presentation/authors/dto/filter-author.dto';
import { AuthorResponseDto } from '@/presentation/authors/dto/author.response.dto';

import { CreateAuthorUseCase } from '@/application/authors/use-cases/create-author/create-author.use-case';
import { UpdateAuthorUseCase } from '@/application/authors/use-cases/update-author/update-author.use-case';
import { GetAuthorsUseCase } from '@/application/authors/use-cases/get-authors/get-authors.use-case';
import { GetAuthorByIdUseCase } from '@/application/authors/use-cases/get-author-by-id/get-author-by-id.use-case';
import { DeleteAuthorUseCase } from '@/application/authors/use-cases/delete-author/delete-author.use-case';

import { CreateAuthorCommand } from '@/application/authors/use-cases/create-author/create-author.command';
import { UpdateAuthorCommand } from '@/application/authors/use-cases/update-author/update-author.command';
import { GetAuthorsQuery } from '@/application/authors/use-cases/get-authors/get-authors.query';
import { DeleteAuthorCommand } from '@/application/authors/use-cases/delete-author/delete-author.command';

import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';

@ApiTags('Authors')
@Controller('authors')
export class AuthorsController {
    constructor(
        private readonly createAuthorUseCase: CreateAuthorUseCase,
        private readonly updateAuthorUseCase: UpdateAuthorUseCase,
        private readonly getAuthorsUseCase: GetAuthorsUseCase,
        private readonly getAuthorByIdUseCase: GetAuthorByIdUseCase,
        private readonly deleteAuthorUseCase: DeleteAuthorUseCase,
        private readonly mediaService: IMediaService,
    ) {}

    @Post()
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('photoUrl'))
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createAuthorDto: CreateAuthorDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const command = new CreateAuthorCommand(
            createAuthorDto.name,
            createAuthorDto.bio,
            file ? await this.uploadFile(file) : createAuthorDto.photoUrl
        );
        
        const author = await this.createAuthorUseCase.execute(command);
        return {
            message: 'Tạo tác giả thành công',
            data: new AuthorResponseDto(author),
        };
    }

    @Get('admin')
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async findAll(
        @Query() filter: FilterAuthorDto,
        @Query('current') current: string = '1',
        @Query('pageSize') pageSize: string = '10',
    ) {
        const query = new GetAuthorsQuery(
            Number(current),
            Number(pageSize),
            filter.name,
            filter.bio
        );
        
        const result = await this.getAuthorsUseCase.execute(query);
        
        return {
            message: 'Lấy danh sách tác giả thành công',
            data: result.data.map(author => new AuthorResponseDto(author)),
            meta: result.meta,
        };
    }

    @Get(':id')
    @Public()
    async findOne(@Param('id') id: string) {
        const author = await this.getAuthorByIdUseCase.execute(id);
        return {
            message: 'Lấy thông tin tác giả thành công',
            data: new AuthorResponseDto(author),
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
        const command = new UpdateAuthorCommand(
            id,
            updateAuthorDto.name,
            updateAuthorDto.bio,
            file ? await this.uploadFile(file) : updateAuthorDto.photoUrl
        );
        
        const author = await this.updateAuthorUseCase.execute(command);
        return {
            message: 'Cập nhật tác giả thành công',
            data: new AuthorResponseDto(author),
        };
    }

    @Delete(':id')
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async remove(@Param('id') id: string) {
        const command = new DeleteAuthorCommand(id);
        await this.deleteAuthorUseCase.execute(command);
        return {
            message: 'Xóa tác giả thành công',
        };
    }

    @Get()
    @Public()
    async getForSelect() {
        // This would need a separate use case for getting authors for select
        // For now, we'll use the existing getAuthorsUseCase with no filters
        const query = new GetAuthorsQuery(1, 1000); // Get all authors for select
        const result = await this.getAuthorsUseCase.execute(query);
        
        return {
            message: 'Lấy danh sách tác giả thành công',
            data: result.data.map(author => ({
                _id: author.id.toString(),
                name: author.name.toString(),
                bio: author.bio
            })),
        };
    }

    private async uploadFile(file: Express.Multer.File): Promise<string> {
        return await this.mediaService.uploadImage(file);
    }
}
