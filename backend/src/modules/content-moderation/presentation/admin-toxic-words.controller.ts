import { CommandBus, QueryBus } from '@nestjs/cqrs';
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

import { JwtAuthGuard } from '@/shared/platform/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { AddToxicWordDto } from './dto/add-toxic-word.dto';
import { AddToxicWordCommand } from '@/modules/content-moderation/application/commands/add-toxic-word/add-toxic-word.command';
import { DeleteToxicWordCommand } from '@/modules/content-moderation/application/commands/delete-toxic-word/delete-toxic-word.command';
import { GetToxicWordsQuery } from '@/modules/content-moderation/application/queries/get-toxic-words/get-toxic-words.query';

@ApiTags('Admin Content Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/toxic-words')
export class AdminToxicWordsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Láº¥y danh sÃ¡ch cÃ¡c tá»« khÃ³a toxic' })
  async getToxicWords() {
    const query = new GetToxicWordsQuery();
    const words = await this.queryBus.execute(query);
    return {
      message: 'Láº¥y danh sÃ¡ch tá»« khÃ³a toxic thÃ nh cÃ´ng',
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
  @ApiOperation({ summary: 'ThÃªm má»™t tá»« khÃ³a toxic má»›i' })
  async addToxicWord(@Body() dto: AddToxicWordDto) {
    const command = new AddToxicWordCommand(
      dto.pattern,
      dto.group,
      (dto as any).originalWord,
    );
    const word = await this.commandBus.execute(command);
    return {
      message: 'ThÃªm tá»« khÃ³a toxic thÃ nh cÃ´ng',
      data: {
        id: word.id,
        pattern: word.pattern,
        group: word.group,
        originalWord: word.originalWord,
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'XÃ³a má»™t tá»« khÃ³a toxic' })
  async deleteToxicWord(@Param('id') id: string) {
    const command = new DeleteToxicWordCommand(id);
    await this.commandBus.execute(command);
    return {
      message: 'XÃ³a tá»« khÃ³a toxic thÃ nh cÃ´ng',
    };
  }
}
