import { Role } from '../../domain/entities/role.entity';
import { Role as PrismaRole } from '@/core/database/generated/prisma/client';

export class RoleMapper {
  static toDomain(roleRow: PrismaRole): Role {
    return Role.reconstitute({
      id: roleRow.id,
      name: roleRow.name,
      createdAt: roleRow.createdAt,
      updatedAt: roleRow.updatedAt,
    });
  }
}
