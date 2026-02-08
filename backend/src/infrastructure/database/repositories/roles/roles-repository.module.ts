import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from '@/infrastructure/database/schemas/role.schema';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { RoleRepository } from './role.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  providers: [
    {
      provide: IRoleRepository,
      useClass: RoleRepository,
    },
  ],
  exports: [
    IRoleRepository,
    MongooseModule,
  ],
})
export class RolesRepositoryModule {}
