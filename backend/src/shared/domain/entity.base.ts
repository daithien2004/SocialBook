export abstract class Entity<ID> {
  private readonly entityId: ID;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  protected constructor(id: ID, createdAt?: Date, updatedAt?: Date) {
    this.entityId = id;
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
  }

  get id(): ID {
    return this.entityId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }
}
