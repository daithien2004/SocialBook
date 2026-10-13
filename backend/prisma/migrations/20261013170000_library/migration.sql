CREATE TABLE "reading_progress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "chapterId" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'READING',
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "pagesRead" INTEGER NOT NULL DEFAULT 0,
    "wordsRead" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reading_progress_status_check" CHECK ("status" IN ('READING', 'COMPLETED'))
);

CREATE TABLE "reading_lists" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READING',
    "lastReadChapterId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reading_lists_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reading_lists_status_check" CHECK ("status" IN ('READING', 'COMPLETED', 'ARCHIVED', 'NONE'))
);

CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reading_list_collections" (
    "readingListId" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    CONSTRAINT "reading_list_collections_pkey" PRIMARY KEY ("readingListId", "collectionId")
);

CREATE UNIQUE INDEX "reading_progress_userId_chapterId_key" ON "reading_progress"("userId", "chapterId");
CREATE INDEX "reading_progress_userId_bookId_idx" ON "reading_progress"("userId", "bookId");
CREATE INDEX "reading_progress_lastReadAt_idx" ON "reading_progress"("lastReadAt");
CREATE INDEX "reading_progress_userId_lastReadAt_idx" ON "reading_progress"("userId", "lastReadAt");
CREATE INDEX "reading_progress_bookId_lastReadAt_idx" ON "reading_progress"("bookId", "lastReadAt");
CREATE UNIQUE INDEX "reading_lists_userId_bookId_key" ON "reading_lists"("userId", "bookId");
CREATE INDEX "reading_lists_userId_status_updatedAt_idx" ON "reading_lists"("userId", "status", "updatedAt");
CREATE UNIQUE INDEX "collections_userId_name_key" ON "collections"("userId", "name");
CREATE INDEX "reading_list_collections_collectionId_readingListId_idx" ON "reading_list_collections"("collectionId", "readingListId");

ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reading_lists" ADD CONSTRAINT "reading_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reading_lists" ADD CONSTRAINT "reading_lists_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reading_lists" ADD CONSTRAINT "reading_lists_lastReadChapterId_fkey" FOREIGN KEY ("lastReadChapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reading_list_collections" ADD CONSTRAINT "reading_list_collections_readingListId_fkey" FOREIGN KEY ("readingListId") REFERENCES "reading_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reading_list_collections" ADD CONSTRAINT "reading_list_collections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
