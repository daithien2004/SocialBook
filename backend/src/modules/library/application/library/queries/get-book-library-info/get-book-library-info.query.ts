import { Query } from '@nestjs/cqrs';

import { GetBookLibraryInfoResult } from '@/modules/library/application/library/queries/get-book-library-info/get-book-library-info.handler';
import type { Actor } from '@/shared/casl/actor';

export class GetBookLibraryInfoQuery extends Query<GetBookLibraryInfoResult> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly bookId: string,
  ) {
    super();
  }
}
