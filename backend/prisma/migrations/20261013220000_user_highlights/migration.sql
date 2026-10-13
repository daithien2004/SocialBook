CREATE TABLE "user_highlights" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "chapterId" UUID NOT NULL,
    "paragraphId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#ffeb3b',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_highlights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_highlights_userId_bookId_createdAt_id_idx" ON "user_highlights"("userId", "bookId", "createdAt", "id");
CREATE INDEX "user_highlights_userId_chapterId_createdAt_id_idx" ON "user_highlights"("userId", "chapterId", "createdAt", "id");

ALTER TABLE "user_highlights" ADD CONSTRAINT "user_highlights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_highlights" ADD CONSTRAINT "user_highlights_bookId_chapterId_fkey" FOREIGN KEY ("bookId", "chapterId") REFERENCES "chapters"("bookId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_highlights" ADD CONSTRAINT "user_highlights_chapterId_paragraphId_fkey" FOREIGN KEY ("chapterId", "paragraphId") REFERENCES "paragraphs"("chapterId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
