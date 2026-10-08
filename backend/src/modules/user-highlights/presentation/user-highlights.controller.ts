import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentAbility } from '@/common/decorators/current-ability.decorator';
import type { AppAbility } from '@socialbook/shared';
import { CreateUserHighlightCommand } from '@/modules/user-highlights/application/commands/create-user-highlight/create-user-highlight.command';
import { UpdateUserHighlightCommand } from '@/modules/user-highlights/application/commands/update-user-highlight/update-user-highlight.command';
import { DeleteUserHighlightCommand } from '@/modules/user-highlights/application/commands/delete-user-highlight/delete-user-highlight.command';
import { GetUserHighlightsQuery } from '@/modules/user-highlights/application/queries/get-user-highlights/get-user-highlights.query';
import { CreateUserHighlightDto } from './dto/create-user-highlight.dto';
import { UpdateUserHighlightDto } from './dto/update-user-highlight.dto';

@Controller('user-highlights')
@UseGuards(JwtAuthGuard)
export class UserHighlightsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
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
      data: {
        id: highlight.id,
        bookId: highlight.bookId,
        chapterId: highlight.chapterId,
        paragraphId: highlight.paragraphId,
        content: highlight.content,
        color: highlight.color,
        note: highlight.note,
        createdAt: highlight.createdAt,
      },
    };
  }

  @Get('book/:bookId')
  async getHighlightsByBook(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    const query = new GetUserHighlightsQuery(userId, bookId, undefined);
    const highlights = await this.queryBus.execute(query);
    return {
      data: highlights.map((h: any) => ({
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
    };
  }

  @Get('chapter/:chapterId')
  async getHighlightsByChapter(
    @CurrentUser('id') userId: string,
    @Param('chapterId') chapterId: string,
  ) {
    const query = new GetUserHighlightsQuery(userId, undefined, chapterId);
    const highlights = await this.queryBus.execute(query);
    return {
      data: highlights.map((h: any) => ({
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
    };
  }

  @Patch(':id')
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
      data: {
        id: highlight.id,
        color: highlight.color,
        note: highlight.note,
        updatedAt: highlight.updatedAt,
      },
    };
  }

  @Delete(':id')
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
    return { success: true };
  }
}
