export class Role {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(name: string): Role {
    return new Role(
      '',
      name,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }): Role {
    return new Role(
      props.id,
      props.name,
      props.createdAt,
      props.updatedAt,
    );
  }
}
