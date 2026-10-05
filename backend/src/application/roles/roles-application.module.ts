import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { GetRoleByNameHandler } from './use-cases/get-role-by-name.handler';
import { RolesRepositoryModule } from '@/infrastructure/database/repositories/roles/roles-repository.module';

@Module({
  imports: [
    CqrsModule,RolesRepositoryModule],
  providers: [GetRoleByNameHandler],
  exports: [GetRoleByNameHandler],
})
export class RolesApplicationModule {}
