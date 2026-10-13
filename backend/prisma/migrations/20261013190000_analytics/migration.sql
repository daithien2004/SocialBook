CREATE TABLE "user_preferences" (
    "userId" UUID NOT NULL,
    "genreId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("userId", "genreId")
);

CREATE TABLE "user_events" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "bookId" UUID,
    "chapterId" UUID,
    "durationSeconds" INTEGER DEFAULT 0,
    "progressPercent" DOUBLE PRECISION,
    "source" TEXT,
    "deviceType" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_preferences_userId_score_idx" ON "user_preferences"("userId", "score");
CREATE INDEX "user_events_userId_createdAt_idx" ON "user_events"("userId", "createdAt");
CREATE INDEX "user_events_bookId_eventType_idx" ON "user_events"("bookId", "eventType");
CREATE INDEX "user_events_eventType_createdAt_idx" ON "user_events"("eventType", "createdAt");
CREATE INDEX "user_events_createdAt_idx" ON "user_events"("createdAt");

ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
