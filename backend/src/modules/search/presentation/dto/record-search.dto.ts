import { IsNotEmpty, IsString } from 'class-validator';
import { RecordSearchCommand } from '@/modules/search/application/commands/record-search/record-search.command';

export class RecordSearchDto {
  @IsString()
  @IsNotEmpty()
  keyword!: string;

  toCommand(): RecordSearchCommand {
    return new RecordSearchCommand(this.keyword);
  }
}
