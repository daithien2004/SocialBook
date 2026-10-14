import { IsString, MaxLength, MinLength } from 'class-validator';
import { Actor } from '@/shared/casl/actor';
import { Rename__Name__Command } from '../../../application/commands/rename-__kebab__/rename-__kebab__.command';

export class Rename__Name__Dto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  toCommand(id: string, actor: Actor): Rename__Name__Command {
    return new Rename__Name__Command(id, this.title, actor);
  }
}
