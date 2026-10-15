import { IsNotEmpty, IsString } from 'class-validator';
import { RecordSearchCommand } from '@/modules/search/application/commands/record-search/record-search.command';
import type { Actor } from '@/shared/casl/actor';

export class RecordSearchDto {
  @IsString()
  @IsNotEmpty()
  keyword!: string;

  toCommand(actor: Actor): RecordSearchCommand {
    return new RecordSearchCommand(actor, this.keyword);
  }
}
