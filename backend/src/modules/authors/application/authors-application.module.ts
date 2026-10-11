import { Module } from '@nestjs/common';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { AuthorsInfrastructureModule } from '../infrastructure/authors-infrastructure.module';
import { AuthorsService } from './authors.service';

@Module({
  imports: [AuthorsInfrastructureModule, IdGeneratorModule],
  providers: [AuthorsService],
  exports: [AuthorsService],
})
export class AuthorsApplicationModule {}
