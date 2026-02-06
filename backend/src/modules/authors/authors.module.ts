import { DataAccessModule } from '@/src/data-access/data-access.module';
import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';

@Module({
  imports: [
    DataAccessModule,
    CloudinaryModule,
  ],
  controllers: [AuthorsController],
  providers: [AuthorsService, CloudinaryService],
  exports: [AuthorsService],
})
export class AuthorsModule { }
