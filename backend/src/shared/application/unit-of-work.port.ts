export abstract class UnitOfWorkPort {
  abstract execute<T>(operation: () => Promise<T>): Promise<T>;
}
