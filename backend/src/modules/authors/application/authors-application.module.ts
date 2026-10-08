import { Module } from '@nestjs/common';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { AuthorsInfrastructureModule } from '../infrastructure/authors-infrastructure.module';
import { AuthorsService } from './authors.service';

@Module({
  imports: [AuthorsInfrastructureModule, IdGeneratorModule],
  providers: [AuthorsService],
  exports: [AuthorsService],
})
export class AuthorsApplicationModule {}
