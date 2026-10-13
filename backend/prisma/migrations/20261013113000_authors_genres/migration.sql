-- CreateTable
CREATE TABLE "authors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_genres" (
    "userId" UUID NOT NULL,
    "genreId" UUID NOT NULL,
    CONSTRAINT "user_favorite_genres_pkey" PRIMARY KEY ("userId", "genreId")
);

-- Drop the transitional text array now that preferences reference normalized genres.
ALTER TABLE "users" DROP COLUMN "favoriteGenres";

-- CreateIndex
CREATE UNIQUE INDEX "authors_name_key" ON "authors"("name");
CREATE UNIQUE INDEX "authors_slug_key" ON "authors"("slug");
CREATE INDEX "authors_createdAt_id_idx" ON "authors"("createdAt", "id");
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");
CREATE INDEX "genres_name_id_idx" ON "genres"("name", "id");
CREATE INDEX "user_favorite_genres_genreId_userId_idx" ON "user_favorite_genres"("genreId", "userId");

-- AddForeignKey
ALTER TABLE "user_favorite_genres" ADD CONSTRAINT "user_favorite_genres_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_favorite_genres" ADD CONSTRAINT "user_favorite_genres_genreId_fkey"
    FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
