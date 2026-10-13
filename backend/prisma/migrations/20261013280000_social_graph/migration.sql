CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bookId" UUID,
    "content" TEXT NOT NULL,
    "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "moderationReason" TEXT,
    "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "posts_createdAt_id_idx" ON "posts"("createdAt" DESC, "id" DESC);
CREATE INDEX "posts_userId_createdAt_id_idx" ON "posts"("userId", "createdAt" DESC, "id" DESC);
CREATE INDEX "posts_bookId_idx" ON "posts"("bookId");
CREATE INDEX "posts_isFlagged_isDeleted_createdAt_idx" ON "posts"("isFlagged", "isDeleted", "createdAt");

CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "parentId" UUID,
    "content" TEXT NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "moderationReason" TEXT,
    "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "comments_targetId_targetType_isDeleted_createdAt_idx" ON "comments"("targetId", "targetType", "isDeleted", "createdAt" DESC);
CREATE INDEX "comments_parentId_isDeleted_idx" ON "comments"("parentId", "isDeleted");
CREATE INDEX "comments_userId_isDeleted_idx" ON "comments"("userId", "isDeleted");
CREATE INDEX "comments_moderationStatus_createdAt_idx" ON "comments"("moderationStatus", "createdAt" DESC);

CREATE TABLE "likes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "likes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "likes_userId_targetType_targetId_key" ON "likes"("userId", "targetType", "targetId");
CREATE INDEX "likes_targetType_targetId_status_idx" ON "likes"("targetType", "targetId", "status");

CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetId" UUID NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "follows_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "follows_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "follows_userId_targetId_key" ON "follows"("userId", "targetId");
CREATE INDEX "follows_targetId_status_createdAt_idx" ON "follows"("targetId", "status", "createdAt" DESC);
CREATE INDEX "follows_userId_status_createdAt_idx" ON "follows"("userId", "status", "createdAt" DESC);
