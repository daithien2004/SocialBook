import { Module } from '@nestjs/common';
import { AuthorsApplicationModule } from './application/authors-application.module';
import { AuthorsController } from './presentation/authors.controller';

@Module({
  imports: [AuthorsApplicationModule],
  controllers: [AuthorsController],
})
export class AuthorsModule {}
