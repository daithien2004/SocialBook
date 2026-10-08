import { Module } from '@nestjs/common';
import { AuthorsApplicationModule } from './application/authors-application.module';
import { AuthorsController } from './presentation/authors.controller';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';

@Module({
  imports: [AuthorsApplicationModule, MediaInfrastructureModule],
  controllers: [AuthorsController],
})
export class AuthorsModule {}
