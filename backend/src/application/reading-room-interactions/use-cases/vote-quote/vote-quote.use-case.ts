import { Injectable } from '@nestjs/common';
import { IQuoteRepository } from '@/domain/reading-room-interactions/repositories/quote.repository.interface';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { VoteQuoteCommand } from './vote-quote.command';

@Injectable()
export class VoteQuoteUseCase {
  constructor(private readonly quoteRepository: IQuoteRepository) {}

  async execute(
    command: VoteQuoteCommand,
  ): Promise<{ voteCount: number; userVoteType: 'up' | 'down' | null }> {
    const quote = await this.quoteRepository.findById(command.quoteId);
    if (!quote) {
      throw new NotFoundDomainException('Không tìm thấy trích dẫn');
    }

    const existingVote = quote.votes.find((v) => v.userId === command.userId);
    const isTogglingOff = existingVote?.type === command.voteType;

    if (isTogglingOff) {
      quote.removeVote(command.userId);
    } else {
      quote.addVote(command.userId, command.voteType);
    }

    await this.quoteRepository.updateVotes(quote);

    return {
      voteCount: quote.voteCount,
      userVoteType: isTogglingOff ? null : command.voteType,
    };
  }
}
