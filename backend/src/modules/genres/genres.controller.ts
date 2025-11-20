// backend/src/modules/genres/genres.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GenresService } from './genres.service';
import { Public } from '@/src/common/decorators/customize';

@Controller('genres')
export class GenresController {
    constructor(private readonly genresService: GenresService) { }

    @Get()
    @Public()
    async getForSelect() {
        const data = await this.genresService.getForSelect();
        return {
            message: 'Lấy danh sách thể loại thành công',
            data,
        };
    }
}