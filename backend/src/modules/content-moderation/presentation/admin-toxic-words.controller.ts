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
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/shared/platform/guards/jwt-auth.guard';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { AddToxicWordDto } from './dto/add-toxic-word.dto';
import { GetToxicWordsQueryDto } from './dto/get-toxic-words.query.dto';
import { ToxicWordResponseDto } from './dto/toxic-word.response.dto';
import { AddToxicWordCommand } from '@/modules/content-moderation/application/commands/add-toxic-word/add-toxic-word.command';
import { DeleteToxicWordCommand } from '@/modules/content-moderation/application/commands/delete-toxic-word/delete-toxic-word.command';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { ApiPaginatedResponse } from '@/shared/platform/decorators/api-response.decorators';
import { paginate } from '@/shared/domain/pagination.types';

@ApiTags('Admin Content Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@ApiProblemResponses()
@Controller('admin/toxic-words')
export class AdminToxicWordsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @CheckPolicy('read', 'ToxicWord')
  @ApiPaginatedResponse(ToxicWordResponseDto, 'offset')
  @ApiOperation({ summary: 'Lấy danh sách các từ khóa toxic' })
  async getToxicWords(
    @CurrentActor() actor: Actor,
    @Query() dto: GetToxicWordsQueryDto,
  ) {
    const page = await this.queryBus.execute(dto.toQuery(actor));
    return paginate(page.items, page.total, dto, (words) =>
      words.map((word) => ToxicWordResponseDto.fromReadModel(word)),
    );
  }

  @Post()
  @CheckPolicy('create', 'ToxicWord')
  @ApiCreatedResponse({ type: ToxicWordResponseDto })
  @ApiOperation({ summary: 'Thêm một từ khóa toxic mới' })
  async addToxicWord(
    @CurrentActor() actor: Actor,
    @Body() dto: AddToxicWordDto,
  ) {
    const command = new AddToxicWordCommand(
      actor,
      dto.pattern,
      dto.group,
      dto.originalWord,
    );
    const word = await this.commandBus.execute(command);
    return ToxicWordResponseDto.fromResult(word);
  }

  @HttpCode(204)
  @CheckPolicy('delete', 'ToxicWord')
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một từ khóa toxic' })
  async deleteToxicWord(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const command = new DeleteToxicWordCommand(actor, id);
    await this.commandBus.execute(command);
    return undefined;
  }
}
