CREATE TABLE "toxic_words" (
    "id" UUID NOT NULL,
    "pattern" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "originalWord" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "toxic_words_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "toxic_words_pattern_key" ON "toxic_words"("pattern");
