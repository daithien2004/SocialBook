import { Dispatcher } from '@/application/common/dispatcher';
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
import { AddToxicWordDto } from './dto/add-toxic-word.dto';
import { AddToxicWordCommand } from '@/application/content-moderation/commands/add-toxic-word/add-toxic-word.command';
import { DeleteToxicWordCommand } from '@/application/content-moderation/commands/delete-toxic-word/delete-toxic-word.command';
import { GetToxicWordsQuery } from '@/application/content-moderation/queries/get-toxic-words/get-toxic-words.query';

@ApiTags('Admin Content Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/toxic-words')
export class AdminToxicWordsController {
  constructor(private readonly dispatcher: Dispatcher) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các từ khóa toxic' })
  async getToxicWords() {
    const query = new GetToxicWordsQuery();
    const words = await this.dispatcher.query(query);
    return {
      message: 'Lấy danh sách từ khóa toxic thành công',
      data: words.map((w: any) => ({
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
    const command = new AddToxicWordCommand(
      dto.pattern,
      dto.group,
      (dto as any).originalWord,
    );
    const word = await this.dispatcher.command(command);
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
    const command = new DeleteToxicWordCommand(id);
    await this.dispatcher.command(command);
    return {
      message: 'Xóa từ khóa toxic thành công',
    };
  }
}
