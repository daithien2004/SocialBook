-- CreateTable
CREATE TABLE "books" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "publishedYear" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "vectorIndexedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "roomReferenceRevision" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_genres" (
    "bookId" UUID NOT NULL,
    "genreId" UUID NOT NULL,
    CONSTRAINT "book_genres_pkey" PRIMARY KEY ("bookId", "genreId")
);

-- CreateTable
CREATE TABLE "book_likes" (
    "bookId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "book_likes_pkey" PRIMARY KEY ("bookId", "userId")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "orderIndex" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "roomReferenceRevision" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "ttsStatus" TEXT,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paragraphs" (
    "id" UUID NOT NULL,
    "chapterId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "paragraphs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "books_status_updatedAt_id_idx" ON "books"("status", "updatedAt", "id");
CREATE INDEX "books_authorId_createdAt_id_idx" ON "books"("authorId", "createdAt", "id");
CREATE INDEX "books_createdAt_id_idx" ON "books"("createdAt", "id");
CREATE INDEX "books_views_id_idx" ON "books"("views", "id");
CREATE INDEX "books_likes_id_idx" ON "books"("likes", "id");
CREATE INDEX "books_isDeleted_status_createdAt_id_idx" ON "books"("isDeleted", "status", "createdAt", "id");
CREATE INDEX "book_genres_genreId_bookId_idx" ON "book_genres"("genreId", "bookId");
CREATE INDEX "book_likes_userId_bookId_idx" ON "book_likes"("userId", "bookId");
CREATE UNIQUE INDEX "chapters_bookId_slug_key" ON "chapters"("bookId", "slug");
CREATE INDEX "chapters_bookId_isDeleted_orderIndex_id_idx" ON "chapters"("bookId", "isDeleted", "orderIndex", "id");
CREATE INDEX "chapters_bookId_title_isDeleted_idx" ON "chapters"("bookId", "title", "isDeleted");
CREATE INDEX "chapters_isDeleted_createdAt_id_idx" ON "chapters"("isDeleted", "createdAt", "id");
CREATE UNIQUE INDEX "paragraphs_chapterId_orderIndex_key" ON "paragraphs"("chapterId", "orderIndex");
CREATE INDEX "paragraphs_chapterId_id_idx" ON "paragraphs"("chapterId", "id");

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "book_genres" ADD CONSTRAINT "book_genres_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "book_genres" ADD CONSTRAINT "book_genres_genreId_fkey"
    FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "book_likes" ADD CONSTRAINT "book_likes_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "book_likes" ADD CONSTRAINT "book_likes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "paragraphs" ADD CONSTRAINT "paragraphs_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
