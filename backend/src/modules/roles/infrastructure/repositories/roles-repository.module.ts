import { Module } from '@nestjs/common';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { RoleRepository } from './role.repository';

@Module({
  providers: [
    {
      provide: IRoleRepository,
      useClass: RoleRepository,
    },
  ],
  exports: [IRoleRepository],
})
export class RolesRepositoryModule {}
