CREATE TABLE "ai_requests" (
    "id" UUID NOT NULL,
    "prompt" VARCHAR(10000) NOT NULL,
    "response" TEXT,
    "type" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_requests_userId_createdAt_idx"
    ON "ai_requests"("userId", "createdAt" DESC);
CREATE INDEX "ai_requests_type_createdAt_idx"
    ON "ai_requests"("type", "createdAt" DESC);
CREATE INDEX "ai_requests_createdAt_idx"
    ON "ai_requests"("createdAt" DESC);

ALTER TABLE "ai_requests"
    ADD CONSTRAINT "ai_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
