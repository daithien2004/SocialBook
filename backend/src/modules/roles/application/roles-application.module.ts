import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { GetRoleByNameHandler } from './queries/get-role-by-name/get-role-by-name.handler';
import { RolesInfrastructureModule } from '../infrastructure/roles-infrastructure.module';

@Module({
  imports: [CqrsModule, RolesInfrastructureModule],
  providers: [GetRoleByNameHandler],
  exports: [GetRoleByNameHandler],
})
export class RolesApplicationModule {}
