import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaUnitOfWork } from './prisma-unit-of-work';

@Module({
  providers: [PrismaService, PrismaUnitOfWork],
  exports: [PrismaService, PrismaUnitOfWork],
})
export class PostgresDatabaseModule {}
