import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AddCommentUseCase } from '@/application/reading-room-interactions/use-cases/add-comment/add-comment.use-case';
import { AddCommentCommand } from '@/application/reading-room-interactions/use-cases/add-comment/add-comment.command';
import { DeleteCommentUseCase } from '@/application/reading-room-interactions/use-cases/delete-comment/delete-comment.use-case';
import { DeleteCommentCommand } from '@/application/reading-room-interactions/use-cases/delete-comment/delete-comment.command';
import { AddReactionUseCase } from '@/application/reading-room-interactions/use-cases/add-reaction/add-reaction.use-case';
import { AddReactionCommand } from '@/application/reading-room-interactions/use-cases/add-reaction/add-reaction.command';
import { GetRoomCommentsUseCase } from '@/application/reading-room-interactions/use-cases/get-room-comments/get-room-comments.use-case';
import { GetRoomCommentsQuery } from '@/application/reading-room-interactions/use-cases/get-room-comments/get-room-comments.query';
import { GetRoomReactionsUseCase } from '@/application/reading-room-interactions/use-cases/get-room-reactions/get-room-reactions.use-case';
import { GetRoomReactionsQuery } from '@/application/reading-room-interactions/use-cases/get-room-reactions/get-room-reactions.query';
import { AddQuoteUseCase } from '@/application/reading-room-interactions/use-cases/add-quote/add-quote.use-case';
import { AddQuoteCommand } from '@/application/reading-room-interactions/use-cases/add-quote/add-quote.command';
import { VoteQuoteUseCase } from '@/application/reading-room-interactions/use-cases/vote-quote/vote-quote.use-case';
import { VoteQuoteCommand } from '@/application/reading-room-interactions/use-cases/vote-quote/vote-quote.command';
import { DeleteQuoteUseCase } from '@/application/reading-room-interactions/use-cases/delete-quote/delete-quote.use-case';
import { DeleteQuoteCommand } from '@/application/reading-room-interactions/use-cases/delete-quote/delete-quote.command';
import { GetRoomQuotesUseCase } from '@/application/reading-room-interactions/use-cases/get-room-quotes/get-room-quotes.use-case';
import { GetRoomQuotesQuery } from '@/application/reading-room-interactions/use-cases/get-room-quotes/get-room-quotes.query';
import { AddCommentDto } from './dto/add-comment.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { AddQuoteDto } from './dto/add-quote.dto';
import { VoteQuoteDto } from './dto/vote-quote.dto';

@Controller('reading-rooms/:code')
export class ReadingRoomInteractionsController {
  constructor(
    private readonly addCommentUseCase: AddCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly addReactionUseCase: AddReactionUseCase,
    private readonly addQuoteUseCase: AddQuoteUseCase,
    private readonly deleteQuoteUseCase: DeleteQuoteUseCase,
    private readonly voteQuoteUseCase: VoteQuoteUseCase,
    private readonly getRoomQuotesUseCase: GetRoomQuotesUseCase,
    private readonly getRoomCommentsUseCase: GetRoomCommentsUseCase,
    private readonly getRoomReactionsUseCase: GetRoomReactionsUseCase,
  ) {}

  @Get('comments')
  async getRoomComments(
    @Param('code') code: string,
    @Query('chapterSlug') chapterSlug?: string,
  ) {
    const result = await this.getRoomCommentsUseCase.execute(
      new GetRoomCommentsQuery(code, chapterSlug),
    );
    return {
      data: result.map((c) => ({
        id: c.id,
        paragraphId: c.paragraphId,
        chapterSlug: c.chapterSlug,
        content: c.content,
        userId: c.userId,
        parentCommentId: c.parentCommentId,
        createdAt: c.createdAt,
      })),
    };
  }

  @Get('reactions')
  async getRoomReactions(
    @Param('code') code: string,
    @Query('chapterSlug') chapterSlug?: string,
  ) {
    const result = await this.getRoomReactionsUseCase.execute(
      new GetRoomReactionsQuery(code, chapterSlug),
    );
    return {
      data: result.map((r) => ({
        id: r.id,
        paragraphId: r.paragraphId,
        reactionType: r.reactionType,
        userId: r.userId,
        createdAt: r.createdAt,
      })),
    };
  }

  @Post('comments')
  async addComment(
    @CurrentUser('id') userId: string,
    @Body() dto: AddCommentDto,
  ) {
    const result = await this.addCommentUseCase.execute(
      new AddCommentCommand(
        userId,
        dto.roomId,
        dto.chapterSlug,
        dto.paragraphId,
        dto.content,
        dto.parentCommentId,
      ),
    );
    return {
      data: {
        id: result.id,
        paragraphId: result.paragraphId,
        content: result.content,
        userId: result.userId,
        createdAt: result.createdAt,
      },
    };
  }

  @Delete('comments/:commentId')
  async deleteComment(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
    @Param('commentId') commentId: string,
    @Query('paragraphId') paragraphId: string,
  ) {
    await this.deleteCommentUseCase.execute(
      new DeleteCommentCommand(userId, commentId, code, paragraphId),
    );
    return { message: 'Comment deleted' };
  }

  @Get('quotes')
  async getQuotes(@Param('code') code: string) {
    const result = await this.getRoomQuotesUseCase.execute(
      new GetRoomQuotesQuery(code),
    );
    return {
      data: result.map((q) => ({
        id: q.id,
        content: q.content,
        userId: q.userId,
        chapterSlug: q.chapterSlug,
        paragraphId: q.paragraphId,
        votes: q.votes,
        voteCount: q.voteCount,
        createdAt: q.createdAt,
      })),
    };
  }

  @Post('quotes')
  async addQuote(@CurrentUser('id') userId: string, @Body() dto: AddQuoteDto) {
    const result = await this.addQuoteUseCase.execute(
      new AddQuoteCommand(
        userId,
        dto.roomId,
        dto.chapterSlug,
        dto.paragraphId,
        dto.content,
      ),
    );
    return {
      data: {
        id: result.id,
        content: result.content,
        userId: result.userId,
        chapterSlug: result.chapterSlug,
        paragraphId: result.paragraphId,
        voteCount: 0,
        createdAt: result.createdAt,
      },
    };
  }

  @Delete('quotes/:quoteId')
  async deleteQuote(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
    @Param('quoteId') quoteId: string,
  ) {
    await this.deleteQuoteUseCase.execute(
      new DeleteQuoteCommand(userId, code, quoteId),
    );
    return { message: 'Quote deleted' };
  }

  @Post('quotes/:quoteId/vote')
  async voteQuote(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
    @Param('quoteId') quoteId: string,
    @Body() dto: VoteQuoteDto,
  ) {
    const result = await this.voteQuoteUseCase.execute(
      new VoteQuoteCommand(userId, code, quoteId, dto.voteType),
    );
    return { data: result };
  }

  @Post('reactions')
  async addReaction(
    @CurrentUser('id') userId: string,
    @Body() dto: AddReactionDto,
  ) {
    const result = await this.addReactionUseCase.execute(
      new AddReactionCommand(
        userId,
        dto.roomId,
        dto.chapterSlug,
        dto.paragraphId,
        dto.reactionType,
      ),
    );
    return {
      data: {
        id: result.reaction.id,
        paragraphId: result.reaction.paragraphId,
        reactionType: result.reaction.reactionType,
        userId: result.reaction.userId,
        isRemoved: result.action === 'deleted',
      },
    };
  }
}
