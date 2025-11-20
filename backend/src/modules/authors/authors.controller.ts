import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { Public } from '@/src/common/decorators/customize';
@Controller('authors')
export class AuthorsController {
    constructor(private readonly authorsService: AuthorsService) { }

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