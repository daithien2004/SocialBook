import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AddToxicWordUseCase } from '@/application/content-moderation/use-cases/add-toxic-word.use-case';
import { DeleteToxicWordUseCase } from '@/application/content-moderation/use-cases/delete-toxic-word.use-case';
import { GetToxicWordsUseCase } from '@/application/content-moderation/use-cases/get-toxic-words.use-case';
import { AddToxicWordDto } from './dto/add-toxic-word.dto';

@ApiTags('Admin Content Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/toxic-words')
export class AdminToxicWordsController {
  constructor(
    private readonly addToxicWordUseCase: AddToxicWordUseCase,
    private readonly deleteToxicWordUseCase: DeleteToxicWordUseCase,
    private readonly getToxicWordsUseCase: GetToxicWordsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các từ khóa toxic' })
  async getToxicWords() {
    const words = await this.getToxicWordsUseCase.execute();
    return {
      message: 'Lấy danh sách từ khóa toxic thành công',
      data: words.map((w) => ({
        id: w.id,
        pattern: w.pattern,
        group: w.group,
        originalWord: w.originalWord,
        createdAt: w.createdAt,
      })),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Thêm một từ khóa toxic mới' })
  async addToxicWord(@Body() dto: AddToxicWordDto) {
    const word = await this.addToxicWordUseCase.execute(dto);
    return {
      message: 'Thêm từ khóa toxic thành công',
      data: {
        id: word.id,
        pattern: word.pattern,
        group: word.group,
        originalWord: word.originalWord,
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một từ khóa toxic' })
  async deleteToxicWord(@Param('id') id: string) {
    await this.deleteToxicWordUseCase.execute({ id });
    return {
      message: 'Xóa từ khóa toxic thành công',
    };
  }
}
