import { ApiProperty } from '@nestjs/swagger';
import { __Name__ReadModel } from '../../../application/read-models/__kebab__.read-model';

// Response dựng từ read model; không trả thẳng entity hay model Prisma.
export class __Name__Response {
  @ApiProperty() id!: string;
  @ApiProperty() ownerId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() createdAt!: Date;

  static from(model: __Name__ReadModel): __Name__Response {
    return Object.assign(new __Name__Response(), model);
  }
}
