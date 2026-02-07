import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './infrastructure/schemas/role.schema';
import { RoleRepository } from './infrastructure/repositories/role.repository';
import { GetRoleByNameUseCase } from './application/use-cases/get-role-by-name.use-case';
import { IRoleRepository } from './domain/repositories/role.repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  providers: [
    RoleRepository,
    { provide: IRoleRepository, useClass: RoleRepository },
    GetRoleByNameUseCase,
  ],
  exports: [
    IRoleRepository,
    RoleRepository,
    GetRoleByNameUseCase
  ],
})
export class RolesModule { }
