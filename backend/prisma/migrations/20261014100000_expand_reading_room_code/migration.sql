ALTER TABLE "reading_rooms"
    ALTER COLUMN "id" TYPE VARCHAR(10);

ALTER TABLE "reading_room_members"
    ALTER COLUMN "roomId" TYPE VARCHAR(10);

ALTER TABLE "reading_room_highlights"
    ALTER COLUMN "roomId" TYPE VARCHAR(10);
