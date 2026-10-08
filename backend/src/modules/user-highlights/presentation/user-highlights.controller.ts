import { unpaginated } from '@/shared/platform/dto/paginated.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  HttpCode,
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/shared/platform/guards/jwt-auth.guard';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { CurrentAbility } from '@/shared/platform/decorators/current-ability.decorator';
import type { AppAbility } from '@socialbook/shared';
import { CreateUserHighlightCommand } from '@/modules/user-highlights/application/commands/create-user-highlight/create-user-highlight.command';
import { UpdateUserHighlightCommand } from '@/modules/user-highlights/application/commands/update-user-highlight/update-user-highlight.command';
import { DeleteUserHighlightCommand } from '@/modules/user-highlights/application/commands/delete-user-highlight/delete-user-highlight.command';
import { GetUserHighlightsQuery } from '@/modules/user-highlights/application/queries/get-user-highlights/get-user-highlights.query';
import { CreateUserHighlightDto } from './dto/create-user-highlight.dto';
import { UpdateUserHighlightDto } from './dto/update-user-highlight.dto';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

class UserHighlightResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  bookId?: string;

  @ApiPropertyOptional()
  chapterId?: string;

  @ApiPropertyOptional()
  paragraphId?: string;

  @ApiPropertyOptional()
  content?: string;

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  note?: string;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}

@ApiProblemResponses()
@Controller('user-highlights')
@UseGuards(JwtAuthGuard)
export class UserHighlightsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: UserHighlightResponseDto })
  async createHighlight(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateUserHighlightDto,
  ) {
    const command = new CreateUserHighlightCommand(
      userId,
      dto.bookId,
      dto.chapterId,
      dto.paragraphId,
      dto.content,
      dto.color,
      dto.note,
    );
    const highlight = await this.commandBus.execute(command);

    return {
      id: highlight.id,
      bookId: highlight.bookId,
      chapterId: highlight.chapterId,
      paragraphId: highlight.paragraphId,
      content: highlight.content,
      color: highlight.color,
      note: highlight.note,
      createdAt: highlight.createdAt,
    };
  }

  @Get('book/:bookId')
  @ApiPaginatedResponse(UserHighlightResponseDto, 'offset')
  async getHighlightsByBook(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    const query = new GetUserHighlightsQuery(userId, bookId, undefined);
    const highlights = await this.queryBus.execute(query);
    return unpaginated(
      highlights.map((h: any) => ({
        id: h.id,
        bookId: h.bookId,
        chapterId: h.chapterId,
        paragraphId: h.paragraphId,
        content: h.content,
        color: h.color,
        note: h.note,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      })),
    );
  }

  @Get('chapter/:chapterId')
  @ApiPaginatedResponse(UserHighlightResponseDto, 'offset')
  async getHighlightsByChapter(
    @CurrentUser('id') userId: string,
    @Param('chapterId') chapterId: string,
  ) {
    const query = new GetUserHighlightsQuery(userId, undefined, chapterId);
    const highlights = await this.queryBus.execute(query);
    return unpaginated(
      highlights.map((h: any) => ({
        id: h.id,
        bookId: h.bookId,
        chapterId: h.chapterId,
        paragraphId: h.paragraphId,
        content: h.content,
        color: h.color,
        note: h.note,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      })),
    );
  }

  @Patch(':id')
  @ApiOkResponse({ type: UserHighlightResponseDto })
  async updateHighlight(
    @CurrentUser('id') userId: string,
    @Param('id') highlightId: string,
    @CurrentAbility() ability: AppAbility,
    @Body() dto: UpdateUserHighlightDto,
  ) {
    const command = new UpdateUserHighlightCommand(
      highlightId,
      userId,
      ability,
      dto.color,
      dto.note,
    );
    const highlight = await this.commandBus.execute(command);

    return {
      id: highlight.id,
      color: highlight.color,
      note: highlight.note,
      updatedAt: highlight.updatedAt,
    };
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  async deleteHighlight(
    @CurrentUser('id') userId: string,
    @Param('id') highlightId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    const command = new DeleteUserHighlightCommand(
      highlightId,
      userId,
      ability,
    );
    await this.commandBus.execute(command);
  }
}
