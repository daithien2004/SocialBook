export abstract class Identifier {
  private readonly value: string;

  protected constructor(id: string) {
    this.value = id;
  }

  protected static validate(id: string, name: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error(`${name} cannot be empty`);
    }
    return id.trim();
  }

  toString(): string {
    return this.value;
  }

  equals(other: Identifier): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  getValue(): string {
    return this.value;
  }
}
