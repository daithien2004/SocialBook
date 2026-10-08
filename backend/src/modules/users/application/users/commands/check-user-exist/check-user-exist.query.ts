import { Query } from '@nestjs/cqrs';
export class CheckUserExistQuery extends Query<unknown> {
  constructor(
    public readonly email?: string,
    public readonly username?: string,
    public readonly id?: string,
  ) {
    super();
  }
}
