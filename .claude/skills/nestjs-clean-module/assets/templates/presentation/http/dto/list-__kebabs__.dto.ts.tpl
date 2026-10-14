import { IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '@/shared/presentation/page-query.dto';
import { List__Names__Filter } from '../../../application/ports/__kebab__-query.repository';

export class List__Names__Dto extends PageQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  toFilter(): List__Names__Filter {
    return { search: this.search };
  }
}
