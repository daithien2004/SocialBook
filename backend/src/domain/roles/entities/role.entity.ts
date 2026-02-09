import { RoleId } from '../value-objects/role-id.vo';
import { Entity } from '../../../shared/domain/entity.base';

export class Role extends Entity<RoleId> {
  private constructor(
    id: RoleId,
    private _name: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id, createdAt, updatedAt);
  }

  static create(name: string): Role {
    return new Role(
      RoleId.generate(),
      name,
      new Date(),
      new Date()
    );
  }

  static reconstitute(props: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }): Role {
    return new Role(
      RoleId.create(props.id),
      props.name,
      props.createdAt,
      props.updatedAt
    );
  }

  // Getters
  get name(): string {
    return this._name;
  }

  // Business methods
  updateName(name: string): void {
    this._name = name;
    this.markAsUpdated();
  }
}

