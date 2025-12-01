import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ChromaService } from './chroma.service';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';

@Controller('chroma')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChromaController {
    constructor(private readonly chromaService: ChromaService) { }

    // Index lại TẤT CẢ (Books + Chapters + Authors)
    @Roles('admin')
    @Post('reindex-all')
    async reindexAll() {
        const [books, chapters, authors] = await Promise.all([
            this.chromaService.reindexAllBooks(),
            this.chromaService.reindexAllChapters(),
            this.chromaService.reindexAllAuthors(),
        ]);

        return {
            message: 'Reindexed all successfully',
            data: {
                books: books.totalIndexed,
                chapters: chapters.totalIndexed,
                authors: authors.totalIndexed,
                total: books.totalIndexed + chapters.totalIndexed + authors.totalIndexed,
            },
        };
    }

    // Xóa toàn bộ collection
    @Roles('admin')
    @Post('clear')
    async clearCollection() {
        const result = await this.chromaService.clearCollection();

        return {
            message: 'Collection cleared successfully',
            data: result,
        };
    }

    // Kiểm tra tình trạng sách
    @Roles('admin')
    @Get('stats')
    async getStats() {
        const stats = await this.chromaService.getCollectionStats();

        return {
            message: 'Collection stats retrieved',
            data: stats,
        };
    }
}
