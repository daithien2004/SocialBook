import { unpaginated } from '@/shared/platform/dto/paginated.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  HttpCode,
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
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { ApiPaginatedResponse } from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiPropertyOptional,
  ApiProperty,
} from '@nestjs/swagger';

class ToxicWordResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pattern!: string;

  @ApiProperty()
  group!: string;

  @ApiPropertyOptional()
  originalWord?: string;

  @ApiPropertyOptional()
  createdAt?: Date;
}

@ApiTags('Admin Content Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiProblemResponses()
@Controller('admin/toxic-words')
export class AdminToxicWordsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiPaginatedResponse(ToxicWordResponseDto, 'offset')
  @ApiOperation({ summary: 'Láº¥y danh sÃ¡ch cÃ¡c tá»« khÃ³a toxic' })
  async getToxicWords() {
    const query = new GetToxicWordsQuery();
    const words = await this.queryBus.execute(query);
    return unpaginated(
      words.map((w: any) => ({
        id: w.id,
        pattern: w.pattern,
        group: w.group,
        originalWord: w.originalWord,
        createdAt: w.createdAt,
      })),
    );
  }

  @Post()
  @ApiCreatedResponse({ type: ToxicWordResponseDto })
  @ApiOperation({ summary: 'ThÃªm má»™t tá»« khÃ³a toxic má»›i' })
  async addToxicWord(@Body() dto: AddToxicWordDto) {
    const command = new AddToxicWordCommand(
      dto.pattern,
      dto.group,
      (dto as any).originalWord,
    );
    const word = await this.commandBus.execute(command);
    return {
      id: word.id,
      pattern: word.pattern,
      group: word.group,
      originalWord: word.originalWord,
    };
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiOperation({ summary: 'XÃ³a má»™t tá»« khÃ³a toxic' })
  async deleteToxicWord(@Param('id') id: string) {
    const command = new DeleteToxicWordCommand(id);
    await this.commandBus.execute(command);
    return undefined;
  }
}
