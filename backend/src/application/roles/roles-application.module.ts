import { Module } from '@nestjs/common';
import { GetRoleByNameUseCase } from './use-cases/get-role-by-name.use-case';
import { RolesRepositoryModule } from '@/infrastructure/database/repositories/roles/roles-repository.module';

@Module({
  imports: [RolesRepositoryModule],
  providers: [GetRoleByNameUseCase],
  exports: [GetRoleByNameUseCase],
})
export class RolesApplicationModule {}
