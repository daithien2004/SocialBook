export {
  Role as RoleSchemaModel,
  RoleSchema,
} from './infrastructure/schemas/role.schema';
export type { RoleDocument } from './infrastructure/schemas/role.schema';
export { IRoleRepository } from './domain/repositories/role.repository.interface';
export { Role as RoleEntity } from './domain/entities/role.entity';
export { RolesInfrastructureModule } from './infrastructure/roles-infrastructure.module';
export { RolesApplicationModule } from './application/roles-application.module';
export { RolesModule } from './roles.module';
