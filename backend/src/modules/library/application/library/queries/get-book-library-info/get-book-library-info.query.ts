import { Query } from '@nestjs/cqrs';

import { GetBookLibraryInfoResult } from '@/modules/library/application/library/queries/get-book-library-info/get-book-library-info.handler';

export class GetBookLibraryInfoQuery extends Query<GetBookLibraryInfoResult> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) {
    super();
  }
}
