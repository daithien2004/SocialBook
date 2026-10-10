export function isChapterImportStartRequest(
  method: string,
  path: string,
): boolean {
  return (
    method === 'POST' &&
    /^\/api\/v1\/books\/[^/]+\/chapters\/import\/start\/?$/.test(path)
  );
}
