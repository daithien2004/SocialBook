import { Entity } from '@/shared/domain/entity.base';

export interface RoleProps {
  name: string;
}

export class Role extends Entity<string> {
  private _props: RoleProps;

  private constructor(
    id: string,
    props: RoleProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  get name(): string {
    return this._props.name;
  }

  static create(props: { id: string; name: string }): Role {
    return new Role(props.id, { name: props.name });
  }

  static reconstitute(props: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }): Role {
    return new Role(
      props.id,
      { name: props.name },
      props.createdAt,
      props.updatedAt,
    );
  }

  updateName(name: string): void {
    this._props.name = name;
    this.markAsUpdated();
  }
}
