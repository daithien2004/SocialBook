CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionUrl" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_createdAt_id_idx"
    ON "notifications"("userId", "createdAt" DESC, "id" DESC);

CREATE INDEX "notifications_userId_isRead_idx"
    ON "notifications"("userId", "isRead");

CREATE INDEX "notifications_createdAt_idx"
    ON "notifications"("createdAt");

-- Preserve compound uniqueness when either optional metadata key is missing.
CREATE UNIQUE INDEX "notifications_user_type_actor_target_key"
    ON "notifications" (
        "userId",
        "type",
        COALESCE("meta" ->> 'actorId', ''),
        COALESCE("meta" ->> 'targetId', '')
    );

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
