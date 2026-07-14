import { Module } from '@nestjs/common';
import { ReadingRoomInteractionsSchemasModule } from '../../schemas/reading-room-interactions/reading-room-interactions-schemas.module';
import { CommentRepository } from './comment.repository';
import { ReactionRepository } from './reaction.repository';
import { QuoteRepository } from './quote.repository';
import { ICommentRepository } from '@/domain/reading-room-interactions/repositories/comment.repository.interface';
import { IReactionRepository } from '@/domain/reading-room-interactions/repositories/reaction.repository.interface';
import { IQuoteRepository } from '@/domain/reading-room-interactions/repositories/quote.repository.interface';

@Module({
  imports: [ReadingRoomInteractionsSchemasModule],
  providers: [
    { provide: ICommentRepository, useClass: CommentRepository },
    { provide: IReactionRepository, useClass: ReactionRepository },
    { provide: IQuoteRepository, useClass: QuoteRepository },
  ],
  exports: [ICommentRepository, IReactionRepository, IQuoteRepository],
})
export class ReadingRoomInteractionsRepositoryModule {}
