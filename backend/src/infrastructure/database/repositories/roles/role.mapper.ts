import { Role } from '@/domain/roles/entities/role.entity';
import { RoleDocument } from '@/infrastructure/database/schemas/role.schema';

interface RolePersistence {
  name: string;
}

export class RoleMapper {
  static toDomain(roleDoc: RoleDocument): Role {
    return Role.reconstitute({
      id: roleDoc._id.toString(),
      name: roleDoc.name,
      createdAt: roleDoc.createdAt,
      updatedAt: roleDoc.updatedAt,
    });
  }

  static toPersistence(role: Role): RolePersistence {
    return {
      name: role.name,
    };
  }
}
