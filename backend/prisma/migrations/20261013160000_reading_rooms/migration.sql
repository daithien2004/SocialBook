CREATE TABLE "reading_rooms" (
    "id" VARCHAR(6) NOT NULL,
    "bookId" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentChapterId" UUID NOT NULL,
    "currentChapterSlug" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 10,
    "endedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createRequestKey" TEXT,
    "createRequestFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reading_rooms_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reading_rooms_mode_check" CHECK ("mode" IN ('sync', 'free')),
    CONSTRAINT "reading_rooms_status_check" CHECK ("status" IN ('active', 'ended'))
);

CREATE TABLE "reading_room_members" (
    "roomId" VARCHAR(6) NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    CONSTRAINT "reading_room_members_pkey" PRIMARY KEY ("roomId", "userId"),
    CONSTRAINT "reading_room_members_role_check" CHECK ("role" IN ('host', 'member'))
);

CREATE TABLE "reading_room_highlights" (
    "id" UUID NOT NULL,
    "roomId" VARCHAR(6) NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "chapterSlug" TEXT NOT NULL,
    "paragraphId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "aiInsight" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reading_room_highlights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_reading_rooms_host_create_request"
    ON "reading_rooms"("hostId", "createRequestKey");
CREATE INDEX "reading_rooms_status_updatedAt_id_idx"
    ON "reading_rooms"("status", "updatedAt", "id");
CREATE INDEX "reading_rooms_bookId_status_idx"
    ON "reading_rooms"("bookId", "status");
CREATE INDEX "reading_rooms_status_endedAt_id_idx"
    ON "reading_rooms"("status", "endedAt", "id");
CREATE INDEX "reading_room_members_userId_leftAt_roomId_idx"
    ON "reading_room_members"("userId", "leftAt", "roomId");
CREATE INDEX "reading_room_members_userId_roomId_idx"
    ON "reading_room_members"("userId", "roomId");
CREATE INDEX "reading_room_highlights_roomId_createdAt_id_idx"
    ON "reading_room_highlights"("roomId", "createdAt", "id");
CREATE INDEX "reading_room_highlights_roomId_userId_idx"
    ON "reading_room_highlights"("roomId", "userId");

ALTER TABLE "reading_rooms"
    ADD CONSTRAINT "reading_rooms_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reading_rooms"
    ADD CONSTRAINT "reading_rooms_currentChapterId_fkey"
    FOREIGN KEY ("currentChapterId") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reading_rooms"
    ADD CONSTRAINT "reading_rooms_hostId_fkey"
    FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reading_room_members"
    ADD CONSTRAINT "reading_room_members_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "reading_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reading_room_members"
    ADD CONSTRAINT "reading_room_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reading_room_highlights"
    ADD CONSTRAINT "reading_room_highlights_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "reading_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reading_room_highlights"
    ADD CONSTRAINT "reading_room_highlights_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
