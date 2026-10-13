CREATE TABLE "text_to_speech" (
    "id" UUID NOT NULL,
    "chapterId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "audioUrl" TEXT,
    "audioFormat" TEXT DEFAULT 'mp3',
    "audioDuration" DOUBLE PRECISION,
    "characterCount" INTEGER,
    "paragraphCount" INTEGER,
    "errorMessage" TEXT,
    "provider" TEXT,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "text_to_speech_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "text_to_speech_chapterId_status_createdAt_id_idx"
    ON "text_to_speech"("chapterId", "status", "createdAt" DESC, "id" DESC);
CREATE INDEX "text_to_speech_bookId_idx"
    ON "text_to_speech"("bookId");

ALTER TABLE "text_to_speech"
    ADD CONSTRAINT "text_to_speech_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "chapters"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "text_to_speech"
    ADD CONSTRAINT "text_to_speech_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "books"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
