import { Role } from '../../domain/entities/role.entity';
import { RoleDocument } from '../schemas/role.schema';

export class RoleMapper {
  static toDomain(roleDoc: RoleDocument): Role {
    return Role.reconstitute({
      id: roleDoc._id.toString(),
      name: roleDoc.name,
      createdAt: roleDoc.createdAt as Date,
      updatedAt: roleDoc.updatedAt as Date,
    });
  }

  static toPersistence(role: Role): any {
    return {
      name: role.name,
    };
  }
}
