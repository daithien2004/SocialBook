import { PartialType } from '@nestjs/swagger';
import { CreateFolllowDto } from './create-folllow.dto';

export class UpdateFolllowDto extends PartialType(CreateFolllowDto) {}
