CREATE TABLE "chapter_knowledge" (
    "id" UUID NOT NULL,
    "chapterId" UUID NOT NULL,
    "entities" JSONB NOT NULL DEFAULT '[]',
    "relationships" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapter_knowledge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chapter_knowledge_chapterId_key"
    ON "chapter_knowledge"("chapterId");

ALTER TABLE "chapter_knowledge"
    ADD CONSTRAINT "chapter_knowledge_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "chapters"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
