import { Role } from '../entities/role.entity';

export abstract class IRoleRepository {
  abstract findByName(name: string): Promise<Role | null>;
  abstract findById(id: string): Promise<Role | null>;
}
