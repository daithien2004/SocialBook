import { IsString, IsIn } from 'class-validator';

export class VoteQuoteDto {
  @IsString()
  @IsIn(['up', 'down'])
  voteType: 'up' | 'down';
}
