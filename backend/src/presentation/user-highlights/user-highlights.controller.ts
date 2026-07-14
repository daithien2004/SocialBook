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
import { CreateUserHighlightUseCase } from '@/application/user-highlights/commands/create-user-highlight.use-case';
import { UpdateUserHighlightUseCase } from '@/application/user-highlights/commands/update-user-highlight.use-case';
import { DeleteUserHighlightUseCase } from '@/application/user-highlights/commands/delete-user-highlight.use-case';
import { GetUserHighlightsUseCase } from '@/application/user-highlights/queries/get-user-highlights.use-case';
import { CreateUserHighlightDto } from './dto/create-user-highlight.dto';
import { UpdateUserHighlightDto } from './dto/update-user-highlight.dto';

@Controller('user-highlights')
@UseGuards(JwtAuthGuard)
export class UserHighlightsController {
  constructor(
    private readonly createHighlightUseCase: CreateUserHighlightUseCase,
    private readonly updateHighlightUseCase: UpdateUserHighlightUseCase,
    private readonly deleteHighlightUseCase: DeleteUserHighlightUseCase,
    private readonly getHighlightsUseCase: GetUserHighlightsUseCase,
  ) {}

  @Post()
  async createHighlight(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateUserHighlightDto,
  ) {
    const highlight = await this.createHighlightUseCase.execute({
      userId,
      bookId: dto.bookId,
      chapterId: dto.chapterId,
      paragraphId: dto.paragraphId,
      content: dto.content,
      color: dto.color,
      note: dto.note,
    });

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
    const highlights = await this.getHighlightsUseCase.execute({
      userId,
      bookId,
    });
    return {
      data: highlights.map((h) => ({
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
    const highlights = await this.getHighlightsUseCase.execute({
      userId,
      chapterId,
    });
    return {
      data: highlights.map((h) => ({
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
    @Body() dto: UpdateUserHighlightDto,
  ) {
    const highlight = await this.updateHighlightUseCase.execute({
      highlightId,
      userId,
      color: dto.color,
      note: dto.note,
    });

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
  ) {
    await this.deleteHighlightUseCase.execute({ highlightId, userId });
    return { success: true };
  }
}
