import { IsString, MaxLength, MinLength } from 'class-validator';
import { Actor } from '@/shared/casl/actor';
import { Create__Name__Command } from '../../../application/commands/create-__kebab__/create-__kebab__.command';

export class Create__Name__Dto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  toCommand(actor: Actor): Create__Name__Command {
    return new Create__Name__Command(this.title, actor);
  }
}
