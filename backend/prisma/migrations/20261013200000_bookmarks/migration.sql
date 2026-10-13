CREATE TABLE "bookmarks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "chapterId" UUID NOT NULL,
    "paragraphId" UUID NOT NULL,
    "chapterSlug" TEXT NOT NULL,
    "textPreview" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bookmarks_userId_paragraphId_key" ON "bookmarks"("userId", "paragraphId");
CREATE INDEX "bookmarks_userId_bookId_createdAt_idx" ON "bookmarks"("userId", "bookId", "createdAt");
CREATE UNIQUE INDEX "chapters_bookId_id_key" ON "chapters"("bookId", "id");
CREATE UNIQUE INDEX "paragraphs_chapterId_id_key" ON "paragraphs"("chapterId", "id");

ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_bookId_chapterId_fkey" FOREIGN KEY ("bookId", "chapterId") REFERENCES "chapters"("bookId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_chapterId_paragraphId_fkey" FOREIGN KEY ("chapterId", "paragraphId") REFERENCES "paragraphs"("chapterId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
