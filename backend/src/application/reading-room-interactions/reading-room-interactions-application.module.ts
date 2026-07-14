import { Module } from '@nestjs/common';
import { AddCommentUseCase } from './use-cases/add-comment/add-comment.use-case';
import { DeleteCommentUseCase } from './use-cases/delete-comment/delete-comment.use-case';
import { AddReactionUseCase } from './use-cases/add-reaction/add-reaction.use-case';
import { RemoveReactionUseCase } from './use-cases/remove-reaction/remove-reaction.use-case';
import { AddQuoteUseCase } from './use-cases/add-quote/add-quote.use-case';
import { VoteQuoteUseCase } from './use-cases/vote-quote/vote-quote.use-case';
import { DeleteQuoteUseCase } from './use-cases/delete-quote/delete-quote.use-case';
import { GetRoomQuotesUseCase } from './use-cases/get-room-quotes/get-room-quotes.use-case';
import { GetRoomCommentsUseCase } from './use-cases/get-room-comments/get-room-comments.use-case';
import { GetRoomReactionsUseCase } from './use-cases/get-room-reactions/get-room-reactions.use-case';
import { ReadingRoomInteractionsRepositoryModule } from '@/infrastructure/database/repositories/reading-room-interactions/reading-room-interactions-repository.module';
import { ReadingRoomsRepositoryModule } from '@/infrastructure/database/repositories/reading-rooms/reading-rooms-repository.module';

@Module({
  imports: [
    ReadingRoomInteractionsRepositoryModule,
    ReadingRoomsRepositoryModule,
  ],
  providers: [
    AddCommentUseCase,
    DeleteCommentUseCase,
    AddReactionUseCase,
    RemoveReactionUseCase,
    AddQuoteUseCase,
    DeleteQuoteUseCase,
    VoteQuoteUseCase,
    GetRoomQuotesUseCase,
    GetRoomCommentsUseCase,
    GetRoomReactionsUseCase,
  ],
  exports: [
    AddCommentUseCase,
    DeleteCommentUseCase,
    AddReactionUseCase,
    RemoveReactionUseCase,
    AddQuoteUseCase,
    DeleteQuoteUseCase,
    VoteQuoteUseCase,
    GetRoomQuotesUseCase,
    GetRoomCommentsUseCase,
    GetRoomReactionsUseCase,
  ],
})
export class ReadingRoomInteractionsApplicationModule {}
