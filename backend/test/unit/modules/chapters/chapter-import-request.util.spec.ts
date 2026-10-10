import { isChapterImportStartRequest } from '@/modules/chapters/presentation/public-api';

describe('isChapterImportStartRequest', () => {
  it('matches only POST requests to the versioned chapter import start route', () => {
    expect(
      isChapterImportStartRequest(
        'POST',
        '/api/v1/books/a-book/chapters/import/start',
      ),
    ).toBe(true);
    expect(
      isChapterImportStartRequest(
        'GET',
        '/api/v1/books/a-book/chapters/import/start',
      ),
    ).toBe(false);
    expect(
      isChapterImportStartRequest(
        'POST',
        '/api/v1/books/a-book/chapters/import/preview',
      ),
    ).toBe(false);
    expect(isChapterImportStartRequest('POST', '/api/chapters/import')).toBe(
      false,
    );
  });
});
